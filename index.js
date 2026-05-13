import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

let chatHistory = [];

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("SERVER WORKING ✅");
});

// 🔄 RESET MEMORY
app.get("/reset", (req, res) => {
  chatHistory = [];
  res.send("Memory cleared 🧠");
});

// 🤖 ASK AI
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.json({
      answer: "Kuch pucho 😊"
    });
  }

  try {

    // USER MESSAGE SAVE
    chatHistory.push({
      role: "user",
      content: question
    });

    // MEMORY LIMIT
    if (chatHistory.length > 6) {
      chatHistory = chatHistory.slice(-6);
    }

    // GROQ API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content: `
You are NexoraStudy AI.

Rules:
- Answer like a friendly teacher 😊
- Use simple Hindi + English mix
- Keep answers clean and readable
- Use 2-4 emojis maximum
- Do NOT overuse emojis
`
            },

            ...chatHistory
          ],

          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    let answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅";

    // CLEAN TEXT
    answer = answer
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // SAVE AI RESPONSE
    chatHistory.push({
      role: "assistant",
      content: answer
    });

    // FINAL RESPONSE
    res.json({
      answer: answer
    });

  } catch (error) {

    console.log(error);

    res.json({
      answer: "Server busy ❌ Try again"
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
