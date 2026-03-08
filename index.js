const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("NexoraStudy Server Running 🚀");
});

app.post("/ask", (req, res) => {
  const question = req.body.question;

  if (!question) {
    return res.json({
      success: false,
      message: "Question missing"
    });
  }

  res.json({
    success: true,
    question: question,
    answer: "AI answer will come here soon"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
