import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
import Redis from "ioredis";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* -----------------------------
   🔥 REDIS CACHE (PRO LEVEL)
------------------------------*/
const redis = new Redis(process.env.REDIS_URL);

// fallback in-memory cache (if Redis fails)
const memoryCache = new Map();

async function getCache(key) {
  try {
    const redisData = await redis.get(key);
    if (redisData) return JSON.parse(redisData);
  } catch (e) {}

  const mem = memoryCache.get(key);
  if (!mem) return null;

  if (Date.now() - mem.time < 10 * 60 * 1000) {
    return mem.value;
  }

  memoryCache.delete(key);
  return null;
}

async function setCache(key, value) {
  try {
    await redis.setex(key, 600, JSON.stringify(value)); // 10 min
  } catch (e) {}

  memoryCache.set(key, {
    value,
    time: Date.now()
  });
}

/* -----------------------------
   📚 RAG (LOCAL NCERT)
------------------------------*/
function getRagContext() {
  try {
    return fs.readFileSync("./data/ncert.txt", "utf8").slice(0, 2000);
  } catch {
    return "";
  }
}

/* -----------------------------
   🌐 TIMEOUT WRAPPER (ANTI-LAG)
------------------------------*/
function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), ms)
    )
  ]);
}

/* -----------------------------
   🌍 TAVILY WEB SEARCH (OPTIMIZED)
------------------------------*/
async function getWebContext(question) {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: question,
        search_depth: "basic",
        max_results: 5
      })
    });

    const data = await response.json();

    if (!data.results) return "";

    return data.results
      .map(r => `${r.title}\n${r.content}`)
      .join("\n\n");

  } catch {
    return "";
  }
}

/* -----------------------------
   🧠 SMART ROUTER (FAST vs DEEP)
------------------------------*/
function isCurrentAffairs(question) {
  const keywords = [
    "pm", "cm", "president",
    "today", "latest", "news",
    "election", "match", "score",
    "current", "2026"
  ];

  return keywords.some(k =>
    question.toLowerCase().includes(k)
  );
}

/* -----------------------------
   🚀 HOME
------------------------------*/
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Ultra Pro 🚀");
});

/* -----------------------------
   ⚡ MAIN ASK ROUTE (ULTRA PRO)
------------------------------*/
app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;

    if (!question) {
      return res.send("Please ask a question.");
    }

    const key = question.toLowerCase().trim();

    /* 1. CACHE CHECK */
    const cached = await getCache(key);
    if (cached) {
      return res.send(cached + "\n\n⚡ Cached Answer");
    }

    /* 2. SMART MODE */
    const needWeb = isCurrentAffairs(question);

    /* 3. PARALLEL EXECUTION */
    const rag = getRagContext();

    const webPromise = needWeb
      ? withTimeout(getWebContext(question), 4000)
      : Promise.resolve("");

    const webContext = await webPromise.catch(() => "");

    /* 4. AI CALL */
    const aiResponse = await withTimeout(
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemma-3-9b-it:free",
          messages: [
            {
              role: "system",
              content: `
You are NexoraStudy Ultra AI.

RULES:
- Answer in Hindi + English
- Be short, smart, and accurate
- Use WEB only if available
- If no data: say "Latest info not available"

WEB:
${webContext}

RAG:
${rag}
`
            },
            {
              role: "user",
              content: question
            }
          ],
          temperature: 0.2,
          max_tokens: 800
        })
      ),
      8000
    );

    const data = await aiResponse.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      "No answer found.";

    /* 5. SAVE CACHE */
    await setCache(key, answer);

    res.send(answer);

  } catch (error) {
    console.log("ULTRA PRO ERROR:", error);
    res.status(500).send("Server Error");
  }
});

/* -----------------------------
   🚀 START SERVER
------------------------------*/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NexoraStudy Ultra Pro running on ${PORT}`);
});
