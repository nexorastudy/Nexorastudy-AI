const express = require("express");
const Groq = require("groq-sdk");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// 🌐 CORS (allow all)
app.use(cors());

// 📦 JSON support
app.use(express.json());

// 🔐 Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// 🚦 Rate limit (per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60, // 60 requests per min per user
});
app.use(limiter);

// 🤖 Groq API
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ⚡ Cache (fast response)
let cache = new Map();
const CACHE_LIMIT = 500;

// 👥 User tracker (anti-spam)
let userTracker = new Map();

// 🏠 Home check
app.get("/", (req, res) => {
  res.send("🚀 NexoraStudy AI Running");
});

// 🧠 MAIN API (GET version for easy use)
app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;
    const ip = req.ip;

    // ❌ Validation
    if (!question || question.trim() === "") {
      return res.send("Invalid question");
    }

    if (question.length > 200) {
      return res.send("Too long");
    }

    // ⏳ Anti-spam (1 sec gap)
    const last = userTracker.get(ip) || 0;
    if (Date.now() - last < 1000) {
      return res.send("Wait a second...");
    }
    userTracker.set(ip, Date.now());

    // ⚡ Cache check
    if (cache.has(question)) {
      return res.send(cache.get(question));
    }

    // ⏱ Timeout control
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 6000)
    );

    const aiCall = groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Explain shortly in simple Hindi and English: " + question,
        },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 120,
    });

    let response;
    try {
      response = await Promise.race([aiCall, timeout]);
    } catch {
      return res.send("Server busy, try again");
    }

    const answer =
      response.choices?.[0]?.message?.content || "No answer";

    // 💾 Cache save
    cache.set(question, answer);

    if (cache.size > CACHE_LIMIT) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    res.setHeader("Content-Type", "text/plain");
    res.send(answer);

  } catch (err) {
    console.error(err);
    res.send("Error occurred");
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
}); a
