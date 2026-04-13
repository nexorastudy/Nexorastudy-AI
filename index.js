import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🧠 Memory store (temporary)
let chatHistory = [];

app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.json({ answer: "Kuch pucho 😊" });
  }

  try {
    // 👇 Add user message to memory
    chatHistory.push({
      role: "user",
      content: question
    });

    // 🔥 Keep last 5 messages only (performance)
    if (chatHistory.length > 6) {
      chatHistory = chatHistory.slice(-6);
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are NexoraStudy AI.

You remember past conversation.

Rules:
- Answer like a human teacher
- Use simple Hindi + English mix
- Understand context from previous questions
- Give clear and helpful answers
- Be friendly and natural
`
          },
          ...chatHistory
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();

    let answer;

    if (data.choices && data.choices.length > 0) {
      answer = data.choices[0].message.content;

      // 👇 Save AI answer in memory
      chatHistory.push({
        role: "assistant",
        content: answer
      });

    } else if (data.error) {
      answer = "AI Error ❌: " + data.error.message;
    } else {
      answer = "Samajh nahi aaya 😅 dobara pucho";
    }

    res.json({ answer });

  } catch (error) {
    res.json({ answer: "Server busy ❌ Try again" });
  }
});

// 🔥 Reset memory (optional)
app.get("/reset", (req, res) => {
  chatHistory = [];
  res.send("Memory cleared 🧠");
});

app.get("/", (req, res) => {
  res.send("NexoraStudy Human AI with Memory 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
