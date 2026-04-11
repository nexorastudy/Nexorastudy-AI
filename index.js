const express = require("express");
const Groq = require("groq-sdk");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Groq Setup (API key from Render ENV)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ✅ Home Route
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// ✅ Simple Rate Limit (per IP)
let userRequests = {};

// ✅ MAIN AI ROUTE
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.status(400).send("No question provided");
  }

  const userIP = req.ip;

  // 🔒 Limit: 1 request per 2 sec
  if (userRequests[userIP] && Date.now() - userRequests[userIP] < 2000) {
    return res.send("Wait 2 sec ⏳");
  }

  userRequests[userIP] = Date.now();

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content:
            "Explain in simple Hindi and English:\n" + question,
        },
      ],
    });

    const answer =
      chatCompletion.choices?.[0]?.message?.content || "No answer";

    res.send(answer);

  } catch (error) {
    console.error(error);
    res.status(500).send("AI Error: " + error.message);
  }
});

// ✅ Server Start
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
