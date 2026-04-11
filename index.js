const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Home route
app.get("/", (req, res) => {
  res.send("NexoraStudy Server Running 🚀");
});

// Ask route
app.get("/ask", (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  let answer = "";

  const q = question.toLowerCase();

  // Developer / Founder
  if (
    q.includes("developer") ||
    q.includes("founder") ||
    q.includes("creator") ||
    q.includes("kisne banaya") ||
    q.includes("kaun banaya")
  ) {
    answer = "NexoraStudy AI is created by Ajay Chaudhary.";
  }

  // Simple AI answers
  else if (q.includes("hi") || q.includes("hello")) {
    answer = "Hello 👋\n\nKaise ho?\nHow can I help you?";
  }

  else if (q.includes("what is ai")) {
    answer =
      "AI (Artificial Intelligence) ek technology hai jo machines ko insan ki tarah sochne aur decision lene me help karti hai.\n\nAI is a technology that allows machines to think and act like humans.";
  }

  else {
    answer =
      "Sorry 😅\n\nAbhi simple version hai.\nTumne poocha: " +
      question +
      "\n\nIska advanced answer future update me milega 🚀";
  }

  res.send(answer);
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
