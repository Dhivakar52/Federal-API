// routes/translateRoute.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { getGeminiModel, getCurrentModelName } = require("../constants/gemini"); // ✅ Import from constants

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
  // ✅ Get model from database
  const model = await getGeminiModel();

  const prompt = `
Translate the following article into ${language}.
- Do not include any HTML tags.
- For headings (h1-h6), place them on a separate line.
- For each paragraph, place it on a new line.
- Do not explain anything. Only return the translated and structured content.

⚠️ STRICT LANGUAGE RULE:
- Response MUST be ONLY in ${language}
- Do NOT mix English unless selected

Here is the content:
${text}
`;

  console.log(`🤖 Translating content with model...`);
  console.log(`🌐 Target Language: ${language}`);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// POST /translate
router.post("/", async (req, res) => {
  const { url, targetLanguage } = req.body;

  try {
    console.log(`📥 Translation request received`);
    console.log(`🌐 Target Language: ${targetLanguage}`);
    console.log(`🔗 URL: ${url}`);

    const { title, description, text } = await extractArticle(url);
    if (!text) {
      return res.status(400).json({ 
        success: false,
        error: "No article content found." 
      });
    }

    // ✅ Get model name for response
    const modelName = await getCurrentModelName();

    const translatedTitle = await translateText(title, targetLanguage);
    const translatedDesc = await translateText(description, targetLanguage);
    const translatedText = await translateText(text, targetLanguage);

    console.log(`✅ Translation completed successfully`);

    res.json({
      success: true,
      title: translatedTitle,
      description: translatedDesc,
      text: translatedText,
      language: targetLanguage,
      model: modelName,  // ✅ Include model name in response
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Translation Error:", error);
    res.status(500).json({ 
      success: false,
      error: "Translation failed.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;