import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* -------------------------
   SIMPLE CACHE
--------------------------*/
const cache = new Map();

function getCache(key) {
  const data = cache.get(key);
  if (!data) return null;

  if (Date.now() - data.time < 10 * 60 * 1000) {
    return data.value;
  }

  cache.delete(key);
  return null;
}

function setCache(key, value) {
  cache.set(key, {
    value,
    time: Date.now()
  });
}

/* -------------------------
   RAG (NCERT FILE)
--------------------------*/
function getRagContext() {
  try {
    return fs.readFileSync("./data/ncert.txt", "utf8").slice(0, 2000);
  } catch {
    return "";
  }
}

/* -------------------------
   TAVILY WEB SEARCH
--------------------------*/
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

  } catch (err) {
    console.log("Tavily error:", err);
    return "";
  }
}

/* -------------------------
   HOME
--------------------------*/
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

/* -------------------------
   ASK ROUTE
--------------------------*/
app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;

    if (!question) {
      return res.send("Please ask a question.");
    }

    const key = question.toLowerCase().trim();

    /* CACHE CHECK */
    const cached = getCache(key);
    if (cached) {
      return res.send(cached + "\n\n⚡ Cached Answer");
    }

    const rag = getRagContext();
    const webContext = await getWebContext(question);

    /* AI CALL */
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
You are NexoraStudy AI.

Rules:
- Answer in Hindi + English
- Be short and clear
- Use web context if available
- If not, say "Latest info not available"

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
      }
    );

    const data = await aiResponse.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      "No answer found.";

    /* SAVE CACHE */
    setCache(key, answer);

    res.send(answer);

  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Server Error");
  }
});

/* -------------------------
   START SERVER
--------------------------*/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NexoraStudy AI running on port ${PORT}`);
});
