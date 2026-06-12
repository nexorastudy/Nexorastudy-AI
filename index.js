import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// CONFIG
// --------------------
const PORT = process.env.PORT || 10000;
const API_URL = process.env.API_URL; // your AI endpoint
const API_KEY = process.env.API_KEY; // your secret key

// --------------------
// HEALTH CHECK ROUTE
// --------------------
app.get("/", (req, res) => {
  res.send("NexoraStudy AI Backend is Running 🚀");
});

// --------------------
// MAIN AI ROUTE
// --------------------
app.get("/ask", async (req, res) => {
  try {
    const question = req.query.question;

    // validate input
    if (!question || question.trim() === "") {
      return res.json({
        success: false,
        answer: "Question missing hai ❌"
      });
    }

    if (!API_URL || !API_KEY) {
      return res.json({
        success: false,
        answer: "Server configuration missing (API_URL / API_KEY)"
      });
    }

    // call external AI API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        question: question
      })
    });

    // check response
    if (!response.ok) {
      return res.json({
        success: false,
        answer: "AI server error ⚠️ Try again later"
      });
    }

    const data = await response.json();

    // flexible output handling (depends on API)
    const answer =
      data.answer ||
      data.response ||
      data.result ||
      "No response from AI";

    return res.json({
      success: true,
      answer: answer
    });

  } catch (error) {
    console.log("ERROR:", error);

    return res.json({
      success: false,
      answer: "AI service temporarily unavailable ⚠️"
    });
  }
});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
