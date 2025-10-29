// routes/translateRoute.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to extract article content
async function extractArticle(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const title = $("title").first().text();
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  const htmlContent = $("h1, h2, h3, h4, h5, h6, p, div, span")
    .map((_, el) => $(el).text())
    .get()
    .join("\n");

  return { title, description, text: htmlContent };
}

// Function to translate text using Gemini
async function translateText(text, language) {
  const prompt = `
Translate the following article into ${language}.
- Do not include any HTML tags.
- For headings (h1-h6), place them on a separate line.
- For each paragraph, place it on a new line.
- Do not explain anything. Only return the translated and structured content.

Here is the content:
${text}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// POST /translate
router.post("/", async (req, res) => {
  const { url, targetLanguage } = req.body;

  try {
    const { title, description, text } = await extractArticle(url);
    if (!text) return res.status(400).json({ error: "No article content found." });

    const translatedTitle = await translateText(title, targetLanguage);
    const translatedDesc = await translateText(description, targetLanguage);
    const translatedText = await translateText(text, targetLanguage);

    res.json({
      title: translatedTitle,
      description: translatedDesc,
      text: translatedText,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Translation failed." });
  }
});

module.exports = router;
