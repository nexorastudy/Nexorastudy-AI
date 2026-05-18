import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// ✅ RATE LIMIT SYSTEM
const userRequests = {};

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Server Working ✅");
});

// 🤖 ASK AI
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  // ✅ EMPTY CHECK
  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
  }

  // ✅ BASIC SECURITY
  if (question.length > 300) {
    return res.send("Question bahut bada hai ❌");
  }

  // ✅ USER IP
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  // ✅ RATE LIMIT
  const now = Date.now();

  if (!userRequests[ip]) {
    userRequests[ip] = [];
  }

  // OLD REQUEST REMOVE
  userRequests[ip] =
    userRequests[ip].filter(
      (time) => now - time < 60000
    );

  // LIMIT = 20 REQUEST / MINUTE
  if (userRequests[ip].length >= 20) {
    return res.send(
      "Too many requests 🚫 Please wait"
    );
  }

  userRequests[ip].push(now);

  try {

    // 🔥 GROQ API
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`,

          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          // ⚡ FAST MODEL
          model: "llama3-8b-8192",

          messages: [
            {
              role: "system",

              content:
                "You are NexoraStudy AI. Reply like a smart friendly teacher. Use simple Hindi + English mix. Keep answers short, clean and readable."
            },

            {
              role: "user",
              content: question
            }
          ],

          temperature: 0.6,

          max_tokens: 250
        })
      }
    );

    const data = await response.json();

    let answer =
      data?.choices?.[0]?.message?.content;

    // ✅ FAILSAFE
    if (!answer) {
      answer = "Samajh nahi aaya 😅";
    }

    // ✅ CLEAN TEXT
    answer = answer
      .replace(/\\n/g, "\n")
      .replace(/\*\*/g, "")
      .replace(/#{1,6}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ✅ FINAL RESPONSE
    res.send(answer);

  } catch (error) {

    console.log(error);

    res.send(
      "Server busy ❌ Try again"
    );
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(
    "NexoraStudy AI Running on Port " + PORT
  );
});
