import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/ask", (req, res) => {
  const q = req.query.question;

  if (!q) {
    return res.send("Kuch pucho 😊");
  }

  // TEST RESPONSE (AI हटाकर)
  res.send("Tumne pucha: " + q);
});

app.listen(PORT);
