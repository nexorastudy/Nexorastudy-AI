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
        model: "llama3-8b-8192",
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

    // 🔥 Error handling (important)
    if (!response.ok) {
      return res.send("API Error ❌: " + JSON.stringify(data));
    }

    const answer = data.choices?.[0]?.message?.content || "No answer";
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
