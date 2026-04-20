import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("SERVER WORKING ✅");
});

// 🔥 RESET
app.get("/reset", (req, res) => {
  res.send("Memory cleared 🧠");
});

// 🤖 ASK
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.json({ answer: "Kuch pucho 😊" });
  }

  try {
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
- Answer like a friendly teacher
- Use simple Hindi + English mix
- NEVER talk about TextBox, code, UI
- If user says hi → reply normally
`
          },
          {
            role: "user",
            content: `Student question: ${question}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    let answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅";

    res.json({ answer });

  } catch (error) {
    res.json({ answer: "Server busy ❌ Try again" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
