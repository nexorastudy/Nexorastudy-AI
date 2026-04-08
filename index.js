const express = require("express");
const Groq = require("groq-sdk");
const cors = require("cors");

const app = express();

// CORS (important for MIT App)
app.use(cors());

// Groq setup (secure - no hardcode)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Home check
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// Rate limit (basic protection)
let userRequests = {};

app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  const userIP = req.ip;

  // limit: 1 request per 2 sec
  if (
    userRequests[userIP] &&
    Date.now() - userRequests[userIP] < 2000
  ) {
    return res.send("Wait 2 sec ⏳");
  }

  userRequests[userIP] = Date.now();

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Explain shortly in simple Hindi and English: " + question,
        },
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
