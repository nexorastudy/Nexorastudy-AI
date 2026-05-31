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

          model: "llama-3.3-70b-versatile",

          messages: [

            {
              role: "system",
              content: `
You are NexoraStudy AI, a smart educational assistant.

Rules:

- Reply in the same language as the user.
- Answer exactly what the user asks.
- Short question = short answer.
- Detailed question = detailed answer.
- For Maths, Accounts, Science, Reasoning and Direction-Distance:
  - Solve step-by-step.
  - Verify calculations before answering.
  - Show the final answer clearly.
- Never invent facts.
- If unsure, clearly say:
  "I am not fully sure about this information."
- Use simple student-friendly language.
- Avoid unnecessary information.
- Do not repeat information.
- Do not repeat examples.
- Do not repeat the same sentence in different words.
- Give one clear final answer.
- Keep answers clean, unique and easy to read.
- For MCQs, provide the correct option first.
- For board exams, prefer NCERT-style explanations.
`
            },

            {
              role: "user",
              content: question
            }

          ],

          temperature: 0.1,
          max_tokens: 400

        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.log(data.error);

      return res.send(
        "❌ API Error: " +
        (data.error.message || "Unknown Error")
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
