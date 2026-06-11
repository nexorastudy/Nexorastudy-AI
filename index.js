import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;

    if (!question) {
      return res.send("Please ask a question.");
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemma-3-9b-it:free",
          messages: [
            {
              role: "user",
              content: question
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      }
    );

    const data = await response.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      "No answer found.";

    res.send(answer);

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("NexoraStudy AI running on port", PORT);
});
