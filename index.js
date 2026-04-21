import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🧠 Simple memory (last 6 messages)
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

// 🤖 ASK ROUTE
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.json({ answer: "Kuch pucho 😊" });
  }

  try {
    // 👉 Save user message
    chatHistory.push({
      role: "user",
      content: question
    });

    // 👉 Limit memory
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
- Answer like a friendly teacher 😊
- Use simple Hindi + English mix
- Keep answers clean and well spaced
- Use 2-4 relevant emojis (😊📚✨🔥)
- Do NOT overuse emojis
- Make answers easy to read (use paragraphs)
- Never mention code, TextBox, or debugging
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

    // ✅ CLEAN + FORMAT (IMPORTANT)
    answer = answer
      .replace(/\\n/g, "\n")        // keep line breaks
      .replace(/\n{3,}/g, "\n\n")   // max 2 line gap
      .replace(/\"/g, "")           // remove quotes
      .trim();

    // 👉 Save AI response
    chatHistory.push({
      role: "assistant",
      content: answer
    });

    res.json({ answer });

  } catch (error) {
    console.error(error);
    res.json({ answer: "Server busy ❌ Try again" });
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
