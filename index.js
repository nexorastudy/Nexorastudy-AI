  import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running ✅");
});

// 🤖 ASK AI
app.get("/ask", async (req, res) => {

  const question = req.query.question;

  // EMPTY QUESTION
  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
  }

  try {

    // ⚡ GROQ API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          // ⚡ FAST MODEL
          model: "llama3-8b-8192",

          messages: [
            {
              role: "system",
              content: `
You are NexoraStudy AI.

Rules:
- Answer fast
- Use simple Hindi + English
- Keep answers short and clean
- Friendly teacher style 😊
- Do NOT use difficult words
`
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

    const data = await response.json();

    // ✅ GET CLEAN ANSWER
    let answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅";

    // ✅ CLEAN TEXT
    answer = answer
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ✅ SEND ONLY TEXT (NO JSON)
    res.send(answer);

  } catch (error) {

    console.log(error);

    // ❌ ERROR MESSAGE
    res.send("Server busy ❌ Try again");
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
