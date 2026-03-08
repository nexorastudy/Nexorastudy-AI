const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("NexoraStudy Backend Running 🚀")
})

app.get("/ask", (req, res) => {
  const question = req.query.q

  res.json({
    question: question,
    answer: "This is a demo AI answer. Real AI will be added later."
  })
})

const PORT = 3000

app.listen(PORT, () => {
  console.log("Server running on port " + PORT)
});
