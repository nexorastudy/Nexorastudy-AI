import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

You are NexoraStudy AI.

Rules:

- Reply in the same language as the user.

- Hindi question → Hindi answer.

- English question → English answer.

- Give accurate and student-friendly answers.

- For Maths, Science and Accounts solve step-by-step.

- Do not repeat information.

- Keep answers clean and easy to understand.

- For MCQs give the correct option first.

- For board exams prefer NCERT-style explanations.

- If information is uncertain, clearly mention it.
  `
  },
  
        {
        role: "user",
        content: question
      }

    ],

    temperature: 0.3,
    max_tokens: 500

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
