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
          query: `${question} latest today`,
          topic: "news",
          search_depth: "advanced",
          max_results: 5
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
    ).slice(0, 1000);
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

    const webContext = await getWebContext(question);

    console.log("WEB CONTEXT:");
    console.log(webContext);

    const ragContext = getRagContext();

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

WEB CONTEXT:
${webContext}

RAG CONTEXT:
${ragContext}

IMPORTANT:
- For PM, CM, President, ministers, elections, sports, and current affairs use WEB CONTEXT first.
- Never guess current affairs answers.
- If WEB CONTEXT does not contain the answer, say:
  "Latest information not available."

Answer in Hindi and English.
`
            },
            {
              role: "user",
              content: question
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      }
    );

    const data = await aiResponse.json();

    console.log(
      "AI RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    if (data.error) {
      return res.send(
        `AI Error: ${data.error.message}`
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content ||
      "No answer found.";

    res.send(answer);

  } catch (error) {
    console.log("SERVER ERROR:", error);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `NexoraStudy AI running on port ${PORT}`
  );
});
