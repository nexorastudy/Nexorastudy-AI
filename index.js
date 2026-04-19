import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🟢 HOME ROUTE (सिर्फ check के लिए)
app.get("/", (req, res) => {
  res.send("SERVER WORKING HOME ✅");
});

// 🟢 AI ROUTE (सिर्फ यहाँ AI चलेगा)
app.get("/ask", async (req, res) => {
  const question = req.query.question;

  // input check
  if (!question || question.trim() === "") {
    return res.send("Kuch pucho 😊");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: "You are a helpful AI. Answer simply in Hindi + English. Do NOT talk about TextBox or code."
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      "Samajh nahi aaya 😅";

    // 🔥 IMPORTANT: plain text send
    res.send(answer);

  } catch (error) {
    res.send("Server error ❌");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
