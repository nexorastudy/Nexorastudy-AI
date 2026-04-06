const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());

// 🔑 Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ⚡ Cache system
let cache = {};
const CACHE_LIMIT = 100;

// 👥 User tracking + rate limit
let userRequests = {};

// 🧠 Main route
app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;
    const userIP = req.ip;

    console.log("User:", userIP, "| Question:", question);

    // ❌ Input validation
    if (!question || question.trim() === "") {
      return res.send("❌ Please enter a valid question");
    }

    if (question.length > 200) {
      return res.send("❌ Question too long (max 200 characters)");
    }

    // ⏳ Simple rate limit (2 sec)
    if (userRequests[userIP] && Date.now() - userRequests[userIP] < 2000) {
      return res.send("⏳ Wait 2 sec and try again");
    }
    userRequests[userIP] = Date.now();

    // ⚡ Cache check
    if (cache[question]) {
      return res.send("⚡ (Fast Answer)\n\n" + cache[question]);
    }

    // 🤖 AI call (FAST MODEL)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful teacher. Answer very short (3-4 lines). First English, then Hindi. Simple language.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 120,
      temperature: 0.5,
    });

    const answer =
      "✨ Great question!\n\n" +
      (chatCompletion.choices[0]?.message?.content || "No answer");

    // 💾 Save cache
    cache[question] = answer;

    // 🔁 Cache limit control
    if (Object.keys(cache).length > CACHE_LIMIT) {
      cache = {};
    }

    res.send(answer);
  } catch (err) {
    console.error("Error:", err);

    res.send("⚠️ Server busy or slow, please try again");
  }
});

// 🏠 Home check
app.get("/", (req, res) => {
  res.send("🚀 NexoraStudy AI Running");
});

// 📊 Stats route
app.get("/stats", (req, res) => {
  res.json({
    totalUsers: Object.keys(userRequests).length,
  });
});

// 🚀 Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
