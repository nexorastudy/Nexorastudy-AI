import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.json({ answer: "Please ask a question" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_GROQ_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Answer in Hindi + English clearly." },
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No answer";

    res.json({ answer });

  } catch (err) {
    res.json({ answer: "Server error ❌" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
