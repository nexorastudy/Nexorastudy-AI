import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* -----------------------------
   WEB CONTEXT (TAVILY SEARCH)
------------------------------*/
async function getWebContext(question) {
  try {
    const result = await tavily.search({
      query: question,
      max_results: 3,
      include_answer: false,
      include_raw_content: false,
    });

    if (!result?.results?.length) return "";

    return result.results
      .map((item, i) => {
        return `Source ${i + 1}:\n${item.title}\n${item.content}`;
      })
      .join("\n\n");

  } catch (error) {
    console.log("Tavily Error:", error);
    return "";
  }
}

/* -----------------------------
   HOME ROUTE
------------------------------*/
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

/* -----------------------------
   ASK AI ROUTE
------------------------------*/
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.send("🤔 Pehle kuch pucho...");
  }

  try {
    // OPTIONAL: web context (safe usage)
    const webContext = await getWebContext(question);

    const messages = [
      {
        role: "system",
        content: `
You are NexoraStudy AI, a smart educational assistant.

Rules:
- Reply in same language as user
- Be clear and student friendly
- For Maths/Science/Accounts: step-by-step solution
- Never repeat lines or unnecessary info
- If unsure say: "I am not fully sure about this information."
- Keep answers clean and concise

If web context is provided, use it only if relevant:
${webContext}
        `,
      },
      {
        role: "user",
        content: question,
      },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.3,
          max_tokens: 400,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.send("❌ API Error: " + JSON.stringify(data));
    }

    let answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.send("😅 Answer nahi mila");
    }

    // clean output
    answer = answer.replace(/\n{2,}/g, "\n").trim();

    res.send(answer);

  } catch (error) {
    console.log(error);
    res.send("🚫 Server busy. Please try again.");
  }
});

/* -----------------------------
   START SERVER
------------------------------*/
app.listen(PORT, () => {
  console.log(`NexoraStudy AI running on port ${PORT}`);
});
