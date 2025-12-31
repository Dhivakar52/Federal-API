const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

/* ✅ Gemini init */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ================= LANGUAGE MAP ================= */
const languagePrompts = {
  Hindi: "in Hindi",
  English: "in English",
  Telugu: "in Telugu",
  Kannada: "in Kannada",
  Marathi: "in Marathi",
  Bengali: "in Bengali",
  Tamil: "in Tamil",
  Gujarati: "in Gujarati",
  Malayalam: "in Malayalam",
};

/* ================= API ================= */
router.post("/", async (req, res) => {
  const { url, language } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const selectedLanguage = languagePrompts[language] || "in Hindi";

  try {
    /* 🔹 Fetch article */
    const response = await axios.get(url, { timeout: 8000 });
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $("title").text();

    const paragraphs = $("p")
      .map((_, el) => $(el).text())
      .get()
      .join("\n\n")
      .slice(0, 6000); // Gemini-safe length

    if (!paragraphs) {
      return res.status(400).json({ error: "No article content found" });
    }

    /* 🔹 Prompt */
    const prompt = `
Summarize the following news article ${selectedLanguage}.
Provide full, well-structured content without missing key details.

${paragraphs}
`;

    /* 🔹 Gemini model */
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({
      title,
      summary,
      language: language || "Hindi",
    });
  } catch (error) {
    console.error("Gemini Summary Error:", error.message);
    res.status(500).json({
      error: "Failed to summarize article",
      details: error.message,
    });
  }
});

module.exports = router;