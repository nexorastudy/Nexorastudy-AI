import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/ask", async (req, res) => {
  let question = req.query.question;

  // 🔥 Fix 1: clean input
  if (!question || question.trim() === "") {
    return res.json({ answer: "Please ask a valid question 😊" });
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
- Answer like a human teacher
- Use simple Hindi + English
- Always answer the question directly
- Never talk about TextBox or code
- Give helpful answers only
`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    let answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅 dobara pucho";

    res.json({ answer });

  } catch (error) {
    res.send(answer);: "Server busy ❌ Try again" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
