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
  query: `${question} latest news`,
  topic: "news",
  days: 30,
  max_results: 2
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
})
        })
      }
    );

    const data = await response.json();

    if (!data.results) return "";

    return data.results
      .map(item => item.title + "\n" + item.content)
      .join("\n\n");

  } catch (error) {
    console.log("Tavily Error:", error);
    return "";
  }
}

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

app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

app.get("/ask", async (req, res) => {
  try {

    const question = req.query.question;

    if (!question) {
      return res.send("Please ask a question.");
    }

    const webContext = await getWebContext(question);console.log("QUESTION:", question);
console.log("WEB CONTEXT:", webContext);
    const ragContext = getRagContext();

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`
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

Answer Format:

🇮🇳 हिंदी:
[सरल हिंदी में उत्तर]

🇬🇧 English:
[Simple English answer]

Rules:
- Always answer in BOTH Hindi and English.
- Hindi must be in Devanagari script.
- Use WEB CONTEXT for latest news and current affairs.
- Use RAG CONTEXT for study notes.
- Maths, Science and Accounts step-by-step.
- Never invent facts.
- Keep answers student-friendly.
`IMPORTANT:
- Always prioritize WEB CONTEXT over your training knowledge.
- If WEB CONTEXT contains relevant information, use it.
- Do not answer from old knowledge when WEB CONTEXT is available.
- If information is uncertain, clearly mention it.
                Current affairs / latest news → Tavily + Groq

Maths / Science / Accounts → Groq only

Founder / app info → RAG only
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

    const answer =
      data?.choices?.[0]?.message?.content ||
      "No answer found.";

    res.send(answer);

  } catch (error) {
    console.log(error);
    res.send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(
    `NexoraStudy AI running on port ${PORT}`
  );
});
