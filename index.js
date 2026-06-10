import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --------------------
// Tavily Web Search
// --------------------
async function getWebContext(question) {
  try {
    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: question,
          topic: "general",
          max_results: 3
        })
      }
    );

    const data = await response.json();

    if (!data.results) return "";

    return data.results
      .map(item => `${item.title}\n${item.content}`)
      .join("\n\n");

  } catch (error) {
    console.log("Tavily Error:", error);
    return "";
  }
}

// --------------------
// Local Study Notes
// --------------------
function getRagContext() {
  try {
    return fs.readFileSync(
      "./data/ncert.txt",
      "utf8"
    ).slice(0, 3000);
  } catch (error) {
    console.log("RAG Error:", error);
    return "";
  }
}

// --------------------
// Home Route
// --------------------
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// --------------------
// Ask Route
// --------------------
app.get("/ask", async (req, res) => {
  try {

    const question = req.query.question;

    if (!question) {
      return res.send("Please ask a question.");
    }

    const newsKeywords = [
      "latest",
      "news",
      "today",
      "current",
      "2026",
      "breaking"
    ];

    const useWebSearch = newsKeywords.some(word =>
      question.toLowerCase().includes(word)
    );

    let webContext = "";

    if (useWebSearch) {
      webContext = await getWebContext(question);
    }

    const ragContext = getRagContext();

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `
You are NexoraStudy AI.

WEB CONTEXT:
${webContext}

RAG CONTEXT:
${ragContext}

Answer Rules:
- Always answer in Hindi and English.
- Hindi must be in Devanagari script.
- Use WEB CONTEXT for latest news.
- Use RAG CONTEXT for study notes.
- Maths, Science and Accounts step-by-step.
- Never invent facts.
- Keep answers student-friendly.

Format:

🇮🇳 हिंदी:
[उत्तर]

🇬🇧 English:
[Answer]
`
            },
            {
              role: "user",
              content: question
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      }
    );
const data = await groqResponse.json();

console.log(
  "GROQ RESPONSE:",
  JSON.stringify(data, null, 2)
);

if (data.error) {
  console.log("GROQ ERROR:", data.error);
  return res.send("AI service temporarily unavailable.");
}

const answer =
  data?.choices?.[0]?.message?.content ||
  "No answer found.";

res.send(answer);
);

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(
    `NexoraStudy AI running on port ${PORT}`
  );
});
