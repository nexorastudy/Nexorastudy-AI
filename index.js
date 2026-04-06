const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
});
app.use(limiter);

// Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Cache
let cache = new Map();
const CACHE_LIMIT = 300;

// User tracker
let userTracker = new Map();

// MAIN API
app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;
    const ip = req.ip;

    if (!question || question.trim() === "") {
      return res.json({ error: "Invalid question" });
    }

    if (question.length > 200) {
      return res.json({ error: "Too long" });
    }

    const last = userTracker.get(ip) || 0;
    if (Date.now() - last < 1200) {
      return res.json({ error: "Slow down" });
    }
    userTracker.set(ip, Date.now());

    if (cache.has(question)) {
      return res.json({ answer: cache.get(question) });
    }

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    const aiCall = groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Answer short (3-4 lines). English then Hindi.",
        },
        { role: "user", content: question },
      ],
      model: "llama-3.1-8b-instant",
    });

    let response;
    try {
      response = await Promise.race([aiCall, timeout]);
    } catch {
      return res.json({ error: "Server busy" });
    }

    const answer =
      "✨ Great question!\n\n" +
      (response.choices?.[0]?.message?.content || "No answer");

    cache.set(question, answer);

    if (cache.size > CACHE_LIMIT) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    res.json({ answer });
  } catch {
    res.json({ error: "Error occurred" });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running");
});
