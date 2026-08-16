import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 10000;

// ==================================================
// ENVIRONMENT CHECK
// ==================================================

const requiredEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "TAVILY_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// ==================================================
// MONGODB
// ==================================================

const mongoClient = new MongoClient(
  process.env.MONGODB_URI,
  {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000
  }
);

let usersCollection;

async function connectMongoDB() {
  await mongoClient.connect();

  const db = mongoClient.db(
    process.env.MONGODB_DB || "nexorastudy"
  );

  usersCollection = db.collection("users");

  await usersCollection.createIndex(
    { email: 1 },
    { unique: true }
  );

  await db.command({ ping: 1 });

  console.log("MongoDB Connected");
}

// ==================================================
// HOME ROUTE
// ==================================================

app.get("/", (req, res) => {
  res.send("NexoraStudy AI Running 🚀");
});

// ==================================================
// SIGNUP
// ==================================================

app.post("/signup", async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    if (email.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Invalid email."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters."
      });
    }

    if (bcrypt.truncates(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password is too long. Please use a shorter password."
      });
    }

    const existingUser =
      await usersCollection.findOne(
        { email },
        { projection: { _id: 1 } }
      );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result =
      await usersCollection.insertOne({
        email,
        passwordHash,
        createdAt: new Date()
      });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      userId: result.insertedId.toString()
    });

  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });
    }

    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account."
    });
  }
});

// ==================================================
// LOGIN
// ==================================================

app.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user =
      await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token =
      jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      userId: user._id.toString(),
      email: user.email
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login."
    });
  }
});

// ==================================================
// TAVILY SEARCH
// ==================================================

async function getWebContext(question) {
  try {
    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${question} latest`,
          topic: "general",
          search_depth: "advanced",
          max_results: 5
        })
      }
    );

    if (!response.ok) {
      console.log(
        "Tavily HTTP Error:",
        response.status
      );
      return "";
    }

    const data =
      await response.json();

    if (!data.results) {
      return "";
    }

    return data.results
      .map(
        item =>
          `${item.title}\n${item.content}`
      )
      .join("\n\n");

  } catch (error) {
    console.log(
      "Tavily Error:",
      error.message
    );

    return "";
  }
}

// ==================================================
// LOCAL RAG CONTEXT
// ==================================================

function getRagContext() {
  try {
    return fs.readFileSync(
      "./data/ncert.txt",
      "utf8"
    ).slice(0, 2000);

  } catch (error) {
    console.log(
      "RAG Error:",
      error.message
    );

    return "";
  }
}

// ==================================================
// ASK ROUTE
// ==================================================

app.get("/ask", async (req, res) => {
  try {
    const question =
      typeof req.query.question === "string"
        ? req.query.question.trim()
        : "";

    if (!question) {
      return res.status(400).send(
        "Please ask a question."
      );
    }

    if (question.length > 4000) {
      return res.status(400).send(
        "Question is too long."
      );
    }

    const webContext =
      await getWebContext(question);

    const ragContext =
      getRagContext();

    const systemPrompt = `

You are NexoraStudy AI.

WEB CONTEXT:
${webContext}

RAG CONTEXT:
${ragContext}

IMPORTANT RULES:

1. ALWAYS answer in TWO sections.
2. First section MUST be in Hindi (Devanagari script only).
3. Second section MUST be in English only.
4. Never skip the Hindi section.
5. Never answer only in English.
6. Use simple student-friendly language.
7. Use WEB CONTEXT for current affairs and latest information.
8. Use RAG CONTEXT for study-related questions.
9. If WEB CONTEXT is empty, answer from general knowledge.
10. Keep answers clear and short.

OUTPUT FORMAT (FOLLOW EXACTLY):

🇮🇳 हिंदी:
[उत्तर केवल हिन्दी में]

🇬🇧 English:
[Answer only in English]
`;

    let answer = "";

    // ==================================================
    // GROQ - PRIMARY
    // ==================================================

    try {
      const groqResponse =
        await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${process.env.GROQ_API_KEY}`
            },

            body: JSON.stringify({
              model:
                "llama-3.1-8b-instant",

              messages: [
                {
                  role: "system",
                  content:
                    systemPrompt
                },
                {
                  role: "user",
                  content:
                    question
                }
              ],

              temperature: 0.3,
              max_tokens: 1000
            })
          }
        );

      if (groqResponse.ok) {
        const groqData =
          await groqResponse.json();

        answer =
          groqData?.choices?.[0]
            ?.message?.content || "";

        if (answer) {
          console.log(
            "Groq Success"
          );
        }
      } else {
        console.log(
          "Groq HTTP Error:",
          groqResponse.status
        );
      }

    } catch (error) {
      console.log(
        "Groq Failed:",
        error.message
      );
    }

    // ==================================================
    // OPENROUTER FALLBACK
    // ==================================================

    if (!answer) {
      try {
        const openrouterResponse =
          await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${process.env.OPENROUTER_API_KEY}`
              },

              body: JSON.stringify({
                model:
                  "google/gemma-3-9b-it:free",

                messages: [
                  {
                    role: "system",
                    content:
                      systemPrompt
                  },
                  {
                    role: "user",
                    content:
                      question
                  }
                ],

                temperature: 0.3,
                max_tokens: 1000
              })
            }
          );

        if (openrouterResponse.ok) {
          const openrouterData =
            await openrouterResponse.json();

          answer =
            openrouterData?.choices?.[0]
              ?.message?.content || "";

          if (answer) {
            console.log(
              "OpenRouter Success"
            );
          }
        } else {
          console.log(
            "OpenRouter HTTP Error:",
            openrouterResponse.status
          );
        }

      } catch (error) {
        console.log(
          "OpenRouter Failed:",
          error.message
        );
      }
    }

    // ==================================================
    // AI FALLBACK
    // ==================================================

    if (
      !answer ||
      answer.trim() === ""
    ) {
      answer = `
🇮🇳 हिंदी:
अभी उत्तर प्राप्त नहीं हो सका। कृपया कुछ सेकंड बाद फिर प्रयास करें।

🇬🇧 English:
Unable to generate a response right now. Please try again in a few seconds.
`;
    }

    return res.send(answer);

  } catch (error) {
    console.error(
      "SERVER ERROR:",
      error.message
    );

    return res.status(500).send(
      "Server Error"
    );
  }
});

// ==================================================
// START SERVER
// ==================================================

async function startServer() {
  try {
    await connectMongoDB();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `NexoraStudy AI running on port ${PORT}`
        );
      }
    );

  } catch (error) {
    console.error(
      "MongoDB connection failed."
    );

    process.exit(1);
  }
}

startServer();
