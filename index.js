const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");

const app = express();
app.use(cors());

// 🔐 Rate Limiting (security)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
app.use(limiter);

// 🔑 OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⚡ Cache system with limit
let cache = {};
const CACHE_LIMIT = 100;

// 👥 User tracking
const users = {};

// 🧠 Main route
app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;
    const ip = req.ip;

    // 📊 User tracking
    users[ip] = (users[ip] || 0) + 1;

    console.log("User:", ip, "| Question:", question);

    // ❌ Input validation
    if (!question || question.trim() === "") {
      return res.json({
        status: "error",
        answer: "Please enter a valid question",
      });
    }

    if (question.length > 200) {
      return res.json({
        status: "error",
        answer: "Question too long (max 200 characters)",
      });
    }

    // ⚡ Cache check
    if (cache[question]) {
      return res.json({
        status: "success",
        answer: cache[question],
        source: "cache",
      });
    }

    // 🤖 AI call (optimized)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful teacher. Answer in very short, simple language (max 3-4 lines). First English, then Hindi.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_tokens: 120,
      temperature: 0.5,
    });

    const answer = response.choices[0].message.content;

    // 💾 Cache save
    cache[question] = answer;

    // 🔁 Cache limit control
    if (Object.keys(cache).length > CACHE_LIMIT) {
      cache = {};
    }

    res.json({
      status: "success",
      answer: answer,
      source: "ai",
    });
  } catch (error) {
    console.error("Error:", error);

    res.json({
      status: "error",
      answer: "⚠️ Server busy, try again in few seconds",
    });
  }
});

// 🏠 Health check
app.get("/", (req, res) => {
  res.send("NexoraStudy Server Running 🚀");
});

// 📊 Basic analytics route
app.get("/stats", (req, res) => {
  res.json({
    totalUsers: Object.keys(users).length,
    totalRequests: Object.values(users).reduce((a, b) => a + b, 0),
  });
});

// 🚀 Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
