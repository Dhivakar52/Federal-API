// routes/analyst.js (Updated)
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { getGeminiModel } = require("../constants/gemini");

const router = express.Router();

const extractArticleText = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const paragraphs = $("p").map((i, el) => $(el).text()).get();
    return paragraphs.join(" ").trim();
  } catch (error) {
    console.error("Error extracting article:", error.message);
    return null;
  }
};

router.post("/", async (req, res) => {
  const { url, language } = req.body;

  try {
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const article = await extractArticleText(url);
    if (!article || article.length < 300) {
      return res.status(400).json({
        error: "Could not extract meaningful content. Article too short or empty.",
      });
    }

    // ✅ Get model from database
    const model = await getGeminiModel();
    
    const prompt = `
You are a professional news analyst.
Response MUST be in ${language || "English"}.
Analyze the following story using User Needs 2.0 framework:
${article.slice(0, 3000)}
`;

    console.log("Sending prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ response: text });
    
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: "Gemini request failed",
      details: err?.message,
    });
  }
});

module.exports = router;