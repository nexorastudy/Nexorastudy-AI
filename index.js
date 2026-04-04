const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

// Test route
app.get("/", (req, res) => {
  res.send("NexoraStudy Server Running 🚀");
});

// Main AI route
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  // 🔥 SMART PROMPT LOGIC
  let prompt = "";

  if (
    question.toLowerCase().includes("developer") ||
    question.toLowerCase().includes("founder") ||
    question.toLowerCase().includes("creator") ||
    question.toLowerCase().includes("kisne banaya") ||
    question.toLowerCase().includes("kaun banaya")
  ) {
    prompt = "NexoraStudy AI is created by Ajay Chaudhary.";
  } else {
    prompt =
      "Answer shortly in simple Hindi and English:\n" + question;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.send("Error: " + data.error.message);
    }

    const answer = data.choices[0].message.content;

    res.send(answer);

  } catch (error) {
    res.send("Server error");
  }
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
