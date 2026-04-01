const express = require("express");
const Groq = require("groq-sdk");

const app = express();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

app.get("/ask", async (req, res) => {
  const question = req.query.question;

  if (!question) {
    return res.send("No question provided");
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: question }
      ],
      model: "llama3-8b-8192",
    });

    const answer = chatCompletion.choices[0].message.content;

    res.send(answer);

  } catch (err) {
    res.send("Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started");
});
