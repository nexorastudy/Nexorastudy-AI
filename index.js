import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME ROUTE
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running ✅");
});

// 🤖 ASK AI ROUTE
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  // EMPTY QUESTION CHECK
  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
  }

  try {

    // ⚡ GROQ API REQUEST
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          // ⚡ FAST MODEL
          model: "llama3-8b-8192",

          messages: [
            {
              role: "system",
              content: `
You are NexoraStudy AI.

Rules:
- Answer fast
- Use simple Hindi + English
- Friendly teacher style 😊
- Keep answers clean and short
- Do not use difficult words
`
            },

            {
              role: "user",
              content: question
            }
          ],

          temperature: 0.5,
          max_tokens: 200
        })
      }
    );

    // ✅ CONVERT RESPONSE
    const data = await response.json();

    // ✅ GET AI ANSWER
    let answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅";

    // ✅ CLEAN TEXT
    answer = answer
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ✅ SEND CLEAN TEXT ONLY
    res.send(answer);

  } catch (error) {

    console.log(error);

    // ❌ ERROR RESPONSE
    res.send("Server busy ❌ Try again");
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
