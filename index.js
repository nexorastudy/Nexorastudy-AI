app.get("/reset", (req, res) => {
  res.send("RESET WORKING 999 🚀");
});import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🧠 Memory store
let chatHistory = [];

// 🟢 HOME CHECK
app.get("/", (req, res) => {
  res.send("SERVER WORKING ✅");
});

// 🔥 RESET ROUTE
app.get("/reset", (req, res) => {
  chatHistory = [];
  res.send("Memory cleared 🧠");
});

// 🤖 ASK ROUTE
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.json({ answer: "Kuch pucho 😊" });
  }

  try {
    // 👉 user message add
    chatHistory.push({
      role: "user",
      content: question
    });

    // 👉 limit memory
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

Rules:
- Answer like a human teacher
- Use simple Hindi + English mix
- DO NOT talk about TextBox, code, or debugging
- Give clear and helpful answers
`
          },
          ...chatHistory
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    let answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅";

    // 👉 AI answer save
    chatHistory.push({
      role: "assistant",
      content: answer
    });

    res.json({ answer });

  } catch (error) {
    res.json({ answer: "Server busy ❌ Try again" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
