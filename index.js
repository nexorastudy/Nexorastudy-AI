const express = require("express");
const Groq = require("groq-sdk");
const cors = require("cors");

const app = express();
app.use(cors());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// user rate limit (safe + simple)
const users = {};

app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

app.get("/ask", async (req, res) => {
  const question = req.query.question;
  const userIP = req.ip;

  if (!question) {
    return res.send("No question provided");
  }

  // ⛔ 2 sec limit per user (API बचाने के लिए)
  const now = Date.now();
  if (users[userIP] && now - users[userIP] < 2000) {
    return res.send("Please wait 2 seconds ⏳");
  }

  users[userIP] = now;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Answer shortly in simple Hindi and English: " + question,
        },
      ],
      model: "llama-3.1-8b-instant",
    });

    const answer =
      response.choices[0]?.message?.content || "No answer";

    res.send(answer);
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
