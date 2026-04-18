import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🧠 Memory store
let chatHistory = [];

app.get("/ask", async (req, res) => {
  const question = req.query.question;

  // ❗ Empty input check
  if (!question || question.trim() === "") {
    return res.json({ answer: "Please ask a proper question 😊" });
  }

  try {
    // 👇 Save user message
    chatHistory.push({
      role: "user",
      content: question
    });

    // 🔥 Keep last 6 messages only
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
You are NexoraStudy AI, a helpful student assistant.

STRICT RULES:
- Give only direct answer to the question
- Do NOT talk about TextBox, code, or input
- Do NOT say "write something" or "ask again"
- Answer in simple Hindi + English (Hinglish)
- Keep answer clear and to the point
- No unnecessary lines
`
          },
          ...chatHistory
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();

    let answer;

    if (data.choices && data.choices.length > 0) {
      answer = data.choices[0].message.content.trim();

      // 👇 Save AI reply
      chatHistory.push({
        role: "assistant",
        content: answer
      });

    } else if (data.error) {
      answer = "AI Error ❌: " + data.error.message;
    } else {
      answer = "No response ❌";
    }

    res.json({ answer });

  } catch (error) {
    res.json({ answer: "Server busy ❌ Try again" });
  }
});

// 🔥 Reset memory
app.get("/reset", (req, res) => {
  chatHistory = [];
  res.send("Memory cleared 🧠");
});

// Test route
app.get("/", (req, res) => {
  res.send("NexoraStudy AI running 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
