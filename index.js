const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Root route
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// Ask route
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",   // ✅ UPDATED MODEL
        messages: [
          {
            role: "system",
            content: "Answer in simple Hindi and English."
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();

    // Proper error handling
    if (!response.ok) {
      return res.send("API Error ❌: " + (data.error?.message || "Unknown error"));
    }

    const answer = data.choices?.[0]?.message?.content || "No answer found";
    res.send(answer);

  } catch (error) {
    console.error(error);
    res.send("Server error ❌: " + error.message);
  }
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
