import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// HOME
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// ASK AI
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.send("🤔 Pehle kuch pucho...");
  }

  try {

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          model: "llama-3.1-8b-instant",

          messages: [

            {
              role: "system",

              content: `
You are NexoraStudy AI, a friendly educational assistant.

Rules:

- Reply in the same language as the user.
- Answer exactly according to the user's question.
- Short question = short answer.
- Detailed question = detailed answer.
- For Maths, Accounts, Science, Reasoning and Direction-Distance:
  • Solve step by step.
  • Verify calculations.
  • Give final answer clearly.
- Never guess facts.
- If unsure, say so clearly.
- Use simple student-friendly language.
- Avoid unnecessary information.
- Provide examples only when useful.
`
            },

            {
              role: "user",
              content: question
            }

          ],

          temperature: 0.1,

          max_tokens: 300

        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.log(data.error);
      return res.send(
        "❌ API Error: " + data.error.message
      );
    }

    let answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.send("😅 Answer nahi mila");
    }

    answer = answer
      .replace(/\\n/g, "\n")
      .replace(/\n{2,}/g, "\n")
      .trim();

    res.send(answer);

  } catch (error) {

    console.log(error);

    res.send(
      "🚫 Server busy. Please try again."
    );
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(
    "NexoraStudy AI running on port " + PORT
  );
});
