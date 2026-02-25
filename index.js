const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: "sk-xxxxxxxx",
});

app.get("/", (req, res) => {
  res.send("AI Server Running");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.json({ answer: "Please ask something." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
    });

    res.json({ answer: response.choices[0].message.content });

  } catch (err) {
    console.log(err);
    res.json({ answer: "Error talking to AI." });
  }
});

app.listen(3000, () => console.log("Running on port 3000"));

