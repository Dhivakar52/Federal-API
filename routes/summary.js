const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { getGeminiModel, getCurrentModelName } = require("../constants/gemini"); // ✅ Import from constants

const router = express.Router();

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
    return res.status(400).json({ 
      success: false,
      error: "URL is required" 
    });
  }

  const selectedLanguage = languagePrompts[language] || "in Hindi";
  const selectedLanguageName = language || "Hindi";

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
      return res.status(400).json({ 
        success: false,
        error: "No article content found" 
      });
    }

    /* 🔹 Prompt */
    const prompt = `
Summarize the following news article ${selectedLanguage}.
Provide full, well-structured content without missing key details.

⚠️ STRICT LANGUAGE RULE:
- Response MUST be in ${selectedLanguage}
- Do NOT mix English unless selected

${paragraphs}
`;

    /* 🔹 Get model from database */
    const model = await getGeminiModel();
    const modelName = await getCurrentModelName();

    console.log(`🤖 Summarizing article with model: ${modelName}`);
    console.log(`🌐 Target Language: ${selectedLanguage}`);
    console.log(`📄 Article Title: ${title}`);

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    console.log(`✅ Summary generated successfully`);

    res.json({
      success: true,
      title,
      summary,
      language: selectedLanguageName,
      model: modelName,  // ✅ Include model name in response
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Gemini Summary Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to summarize article",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;