import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME ROUTE
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// 🤖 ASK AI ROUTE
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  // ❌ EMPTY QUESTION
  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
  }

  try {

    // ⚡ GROQ API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          // ⚡ FAST MODEL
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content:
                "You are NexoraStudy AI. Reply in simple Hindi and English like a friendly teacher."
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

    console.log(data);

    // ❌ API ERROR
    if (data.error) {
      return res.send("API Error ❌");
    }

    // ✅ GET ANSWER
    let answer =
      data?.choices?.[0]?.message?.content;

    // ❌ NO ANSWER
    if (!answer) {
      return res.send("Answer nahi mila 😅");
    }

    // ✨ CLEAN ANSWER
    answer = answer
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ✅ SEND CLEAN TEXT
    res.send(answer);

  } catch (error) {

    console.log(error);

    // ❌ SERVER ERROR
    res.send("Server busy ❌");
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
