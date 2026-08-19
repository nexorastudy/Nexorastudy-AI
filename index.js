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

// ==================================================
// TAVILY WEB SEARCH
// ==================================================
async function getWebContext(question) {
  try {
    if (!process.env.TAVILY_API_KEY) {
      console.log("Tavily API key not configured");
      return "";
    }

    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${question} latest`,
          topic: "general",
          search_depth: "basic",
          max_results: 5
        })
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.log(
        "Tavily HTTP Error:",
        response.status,
        text.slice(0, 500)
      );
      return "";
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data.results)) {
      return "";
    }

    return data.results
      .map(item =>
        `${item.title || ""}\n${item.content || ""}`
      )
      .join("\n\n")
      .slice(0, 6000);

  } catch (error) {
    console.log("Tavily Error:", error.message);
    return "";
  }
}

// ==================================================
// LOCAL RAG
// ==================================================
function getRagContext() {
  try {
    return fs.readFileSync(
      "./data/ncert.txt",
      "utf8"
    ).slice(0, 4000);

  } catch (error) {
    console.log("RAG Error:", error.message);
    return "";
  }
}

// ==================================================
// AI SYSTEM PROMPT
// ==================================================
function createSystemPrompt(webContext, ragContext) {

  return `
You are NexoraStudy AI, a helpful student education assistant.

WEB CONTEXT:
${webContext || "No web context available."}

RAG CONTEXT:
${ragContext || "No RAG context available."}

IMPORTANT RULES:

1. ALWAYS answer in TWO sections.
2. First section MUST be in Hindi using Devanagari script.
3. Second section MUST be in English.
4. Never skip either section.
5. Use simple student-friendly language.
6. For current/latest information, use WEB CONTEXT when available.
7. For study questions, use RAG CONTEXT when relevant.
8. If context is unavailable, use your general knowledge.
9. Keep the answer clear and reasonably short.

OUTPUT FORMAT:

🇮🇳 हिंदी:
[उत्तर हिन्दी में]

🇬🇧 English:
[Answer in English]
`;
}

// ==================================================
// GROQ
// ==================================================
async function askGroq(question, systemPrompt) {

  if (!process.env.GROQ_API_KEY) {
    console.log("Groq API key missing");
    return "";
  }

  try {

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.GROQ_API_KEY}`
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-20b",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: question
            }
          ],

          temperature: 0.3,

          max_tokens: 1000,

          include_reasoning: false
        })
      }
    );

    const text = await response.text();

    // IMPORTANT:
    // HTTP error ko Success nahi bolenge
    if (!response.ok) {

      console.log(
        "Groq HTTP Error:",
        response.status,
        text.slice(0, 800)
      );

      return "";
    }

    const data = JSON.parse(text);

    const answer =
      data?.choices?.[0]?.message?.content || "";

    if (!answer.trim()) {
      console.log("Groq returned empty answer");
      return "";
    }

    console.log("Groq SUCCESS");

    return answer.trim();

  } catch (error) {

    console.log(
      "Groq ERROR:",
      error.message
    );

    return "";
  }
}

// ==================================================
// OPENROUTER FALLBACK
// ==================================================
async function askOpenRouter(question, systemPrompt) {

  if (!process.env.OPENROUTER_API_KEY) {
    console.log("OpenRouter API key missing");
    return "";
  }

  try {

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "Authorization":
            `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "HTTP-Referer":
            "https://nexorastudy-ai.onrender.com",

          "X-Title":
            "NexoraStudy AI"
        },

        body: JSON.stringify({

          // Automatically chooses an available
          // free model
          model: "openrouter/free",

          messages: [
            {
              role: "system",
              content: systemPrompt
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

    const text = await response.text();

    if (!response.ok) {

      console.log(
        "OpenRouter HTTP Error:",
        response.status,
        text.slice(0, 800)
      );

      return "";
    }

    const data = JSON.parse(text);

    const answer =
      data?.choices?.[0]?.message?.content || "";

    if (!answer.trim()) {
      console.log(
        "OpenRouter returned empty answer"
      );
      return "";
    }

    console.log("OpenRouter SUCCESS");

    return answer.trim();

  } catch (error) {

    console.log(
      "OpenRouter ERROR:",
      error.message
    );

    return "";
  }
}

// ==================================================
// HOME
// ==================================================
app.get("/", (req, res) => {

  res.send(
    "NexoraStudy AI Running 🚀"
  );

});

// ==================================================
// ASK
// ==================================================
app.get("/ask", async (req, res) => {

  try {

    const question =
      String(req.query.question || "").trim();

    if (!question) {

      return res.status(400).send(
        "Please ask a question."
      );

    }

    console.log(
      "Question received:",
      question
    );

    // ----------------------------------------------
    // CONTEXT
    // ----------------------------------------------

    const webContext =
      await getWebContext(question);

    const ragContext =
      getRagContext();

    const systemPrompt =
      createSystemPrompt(
        webContext,
        ragContext
      );

    let answer = "";

    // ----------------------------------------------
    // FIRST: GROQ
    // ----------------------------------------------

    answer =
      await askGroq(
        question,
        systemPrompt
      );

    // ----------------------------------------------
    // SECOND: OPENROUTER
    // ----------------------------------------------

    if (!answer) {

      console.log(
        "Trying OpenRouter fallback..."
      );

      answer =
        await askOpenRouter(
          question,
          systemPrompt
        );
    }

    // ----------------------------------------------
    // FINAL FALLBACK
    // ----------------------------------------------

    if (!answer) {

      console.log(
        "ALL AI PROVIDERS FAILED"
      );

      return res.status(503).send(`
🇮🇳 हिंदी:
अभी AI सेवा उपलब्ध नहीं है। कृपया कुछ सेकंड बाद फिर प्रयास करें।

🇬🇧 English:
The AI service is temporarily unavailable. Please try again in a few seconds.
`);

    }

    // ----------------------------------------------
    // SEND ANSWER TO MIT APP INVENTOR
    // ----------------------------------------------

    res
      .status(200)
      .type("text/plain")
      .send(answer);

  } catch (error) {

    console.log(
      "SERVER ERROR:",
      error.message
    );

    res.status(500).send(`
🇮🇳 हिंदी:
सर्वर में समस्या आ गई है। कृपया बाद में फिर प्रयास करें।

🇬🇧 English:
A server error occurred. Please try again later.
`);

  }

});

// ==================================================
// START SERVER
// ==================================================
app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `NexoraStudy AI running on port ${PORT}`
    );

  }
);
