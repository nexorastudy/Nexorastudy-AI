const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("NexoraStudy server running");
});

app.post("/ask", (req, res) => {
  const question = req.body.question;

  if (!question) {
    return res.json({ answer: "Please ask a question." });
  }

  const answer = "Answer for: " + question;
  res.json({ answer });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
