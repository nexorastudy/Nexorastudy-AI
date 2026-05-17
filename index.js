import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running ✅");
});

// 🤖 ASK AI
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  // EMPTY QUESTION
  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
  }

  try {

    // ⚡ GROQ API
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          // ✅ WORKING MODEL
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content: `
You are NexoraStudy AI.

Rules:
- Answer like a friendly teacher 😊
- Use simple Hindi + English
- Keep answers short and clean
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

    // ✅ API RESPONSE
    const data = await response.json();

    console.log(data);

    // ✅ GET ANSWER
    const answer =
      data?.choices?.[0]?.message?.content;

    // ❌ IF NO ANSWER
    if (!answer) {
      return res.send("AI answer nahi mila 😅");
    }

    // ✅ SEND CLEAN TEXT
    res.send(
      answer
        .replace(/\\n/g, "\n")
        .trim()
    );

  } catch (error) {

    console.log(error);

    res.send("Server busy ❌");
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
