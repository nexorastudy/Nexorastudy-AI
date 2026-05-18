import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// 🤖 ASK AI
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
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
              content:
                "You are NexoraStudy AI. Reply in simple Hindi + English like a friendly teacher."
            },

            {
              role: "user",
              content: question
            }
          ],

          temperature: 0.5,
          max_tokens: 200
        })
      }
    );

    // ✅ RAW DATA
    const data = await response.json();

    console.log(data);

    // ❌ API ERROR CHECK
    if (data.error) {
      return res.send("API Error ❌");
    }

    // ✅ ANSWER
    let answer =
      data?.choices?.[0]?.message?.content;

    // ❌ NO ANSWER
    if (!answer) {
      return res.send("Answer nahi mila 😅");
    }

    // ✅ CLEAN
    answer = answer
      .replace(/\\n/g, "\n")
      .trim();

    // ✅ SEND CLEAN TEXT
    res.send(answer);

  } catch (error) {

    console.log(error);

    res.send("Server busy ❌");
  }
});

// 🚀 START
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
