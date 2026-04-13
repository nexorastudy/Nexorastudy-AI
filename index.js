const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors());

// 🔐 Rate Limiter (anti-spam / basic protection)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30, // 30 requests per IP
  message: "Too many requests ❌, try later"
});
app.use(limiter);

// Root
app.get("/", (req, res) => {
  res.send("NexoraStudy AI PRO Running 🚀");
});

// Ask API
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  // Founder logic
  if (
    question.toLowerCase().includes("developer") ||
    question.toLowerCase().includes("founder") ||
    question.toLowerCase().includes("creator")
  ) {
    return res.send("NexoraStudy AI is created by Ajay Chaudhary.");
  }

  // 🔥 Smart Prompt
  const prompt = `
You are NexoraStudy AI, a smart and friendly tutor.

Rules:
- Answer like a human teacher
- Use simple Hindi + English mix
- Be clear and helpful
- No coding answer unless asked

Question: ${question}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.send("API Error ❌");
    }

    const answer = data.choices[0].message.content;
    res.send(answer);

  } catch (error) {
    console.error(error);
    res.send("Server error ❌");
  }
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
