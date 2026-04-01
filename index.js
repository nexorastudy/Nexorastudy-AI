const express = require("express");
const Groq = require("groq-sdk");

const app = express();

// 👉 Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 👉 Home route
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// 👉 AI route
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: "Explain in simple words: " + question }
      ],
      model: "llama-3.1-8b-instant", // ✅ latest working model
    });

    const answer = chatCompletion.choices[0]?.message?.content || "No answer";

    res.send(answer);

  } catch (err) {
    res.send("Error: " + err.message);
  }
});

// 👉 Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
