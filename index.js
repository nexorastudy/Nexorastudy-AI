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

// --------------------
// Tavily Search
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
          query: `${question} latest`,
          topic: "general",
          search_depth: "advanced",
          max_results: 5
        })
      }
    );

    const data = await response.json();

    if (!data.results) return "";

    return data.results
      .map(
        item =>
          `${item.title}\n${item.content}`
      )
      .join("\n\n");

  } catch (error) {
    console.log("Tavily Error:", error);
    return "";
  }
}

// --------------------
// Local RAG Context
// --------------------
function getRagContext() {
  try {
    return fs.readFileSync(
      "./data/ncert.txt",
      "utf8"
    ).slice(0, 2000);
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

    const webContext =
      await getWebContext(question);

    const ragContext =
      getRagContext();

    const systemPrompt = `
You are NexoraStudy AI.

WEB CONTEXT:
${webContext}

RAG CONTEXT:
${ragContext}

Rules:
- Always answer in Hindi and English.
- Hindi must be in Devanagari script.
- English must be separate.
- Keep answers student-friendly.
- Use WEB CONTEXT for latest information.
- Use RAG CONTEXT for study notes.

Format:

🇮🇳 हिंदी:
[उत्तर]

🇬🇧 English:
[Answer]
`;

    let answer = "";

    // --------------------
    // GROQ (Primary)
    // --------------------
    try {
      const groqResponse =
        await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model:
                "llama-3.1-8b-instant",
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

      const groqData =
        await groqResponse.json();

      answer =
        groqData?.choices?.[0]
          ?.message?.content || "";

      console.log(
        "Groq Success"
      );

    } catch (error) {
      console.log(
        "Groq Failed:",
        error
      );
    }

    // --------------------
    // OpenRouter Fallback
    // --------------------
    if (!answer) {
      try {
        const openrouterResponse =
          await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${process.env.OPENROUTER_API_KEY}`
              },
              body: JSON.stringify({
                model:
                  "google/gemma-3-9b-it:free",
                messages: [
                  {
                    role: "system",
                    content:
                      systemPrompt
                  },
                  {
                    role: "user",
                    content:
                      question
                  }
                ],
                temperature: 0.3,
                max_tokens: 1000
              })
            }
          );

        const openrouterData =
          await openrouterResponse.json();

        answer =
          openrouterData?.choices?.[0]
            ?.message?.content ||
          "";

        console.log(
          "OpenRouter Success"
        );

      } catch (error) {
        console.log(
          "OpenRouter Failed:",
          error
        );
      }
    }

    if (!answer || answer.trim() === "") {
  answer = `
🇮🇳 हिंदी:
अभी उत्तर प्राप्त नहीं हो सका। कृपया कुछ सेकंड बाद फिर प्रयास करें।

🇬🇧 English:
Unable to generate a response right now. Please try again in a few seconds.
`;
    }

    res.send(answer);

  } catch (error) {
    console.log(
      "SERVER ERROR:",
      error
    );

    res
      .status(500)
      .send("Server Error");
  }
});

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `NexoraStudy AI running on port ${PORT}`
    );
  }
);
