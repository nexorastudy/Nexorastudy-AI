const express = require("express");
const Groq = require("groq-sdk");

const app = express();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let lastRequestTime = 0;

// Home route
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// Ask route
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  // ⛔ Rate limit (2 sec)
  const now = Date.now();
  if (now - lastRequestTime < 2000) {
    return res.send("Too many requests ❌");
  }
  lastRequestTime = now;

  if (!question) {
    return res.send("No question provided");
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Answer in very simple words (Hindi + English mix, clean and clear): " + question
        }
      ],
      model: "llama-3.1-8b-instant",
    });

    const answer =
      chatCompletion.choices[0]?.message?.content || "No answer";

    res.send(answer);

  } catch (err) {
    res.send("Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
