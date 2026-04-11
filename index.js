const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());

// Groq API setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🔥 ROOT ROUTE (IMPORTANT - Not Found fix)
app.get("/", (req, res) => {
  res.send("NexoraStudy Server Running 🚀");
});

// 🔥 AI ROUTE
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  let prompt = "";

  // 👇 Developer / Founder logic
  if (
    question.toLowerCase().includes("developer") ||
    question.toLowerCase().includes("founder") ||
    question.toLowerCase().includes("creator") ||
    question.toLowerCase().includes("kisne banaya") ||
    question.toLowerCase().includes("kaun banaya")
  ) {
    prompt = "NexoraStudy AI is created by Ajay Chaudhary.";
  } else {
    prompt =
      "Answer shortly in simple Hindi and English:\n" + question;
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    res.send(answer);
  } catch (error) {
    console.error(error);
    res.send("Server error ❌");
  }
});

// 🔥 PORT (IMPORTANT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
