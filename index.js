import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

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
You are NexoraStudy AI.

Rules:

1. Reply in the same language as the user.
2. Answer exactly what the user asks.
3. Short question → short answer.
4. Detailed question → detailed answer.
5. For Maths, Accounts, Science, Reasoning:
   - Solve step-by-step.
   - Verify calculations before answering.
6. Never invent facts.
7. If unsure, clearly say:
   "I am not fully sure about this information."
8. Use simple student-friendly language.
9. Give accurate educational answers.
10. Avoid unnecessary long explanations.
11. For MCQs, provide the correct option first.
12. For definitions, keep answers concise.
13. For board exams, focus on NCERT-style explanations.
14. For current affairs or live information, mention that information may change.
`
            },

            {
              role: "user",
              content: question
            }

          ],

          temperature: 0.1,
          max_tokens: 800

        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.log(data.error);
      return res.send("❌ API Error");
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

    res.send("🚫 Server busy. Please try again.");
  }
});

app.listen(PORT, () => {
  console.log("NexoraStudy AI running on port " + PORT);
});
