const express = require("express");
const axios = require("axios");
const { getGeminiModel } = require("../constants/gemini"); // ✅ Import from constants

const router = express.Router();

const seoPromptTemplates = {
  "Analyze the SEO performance of this article.": `
You are an SEO strategist. Analyze the SEO performance of the given article in a structured, professional report format.
[Your full template here...]
`,
  "Optimize the meta description for this content.": `
Based on the following article, write an SEO-optimized meta description:
{content}
`,
  "Provide tips to improve readability for this piece.": `
Analyze the readability of the article below. Give specific, actionable improvements:
{content}
`,
  "Suggest SEO friendly headlines for the story": `
Based on the article below, generate 5 SEO-friendly headlines:
{content}
`,
};

async function extractArticle(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const matches = response.data.match(/<p[^>]*>(.*?)<\/p>/g);
    if (!matches) return "";
    return matches
      .map((p) => p.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 5000);
  } catch (error) {
    console.error("Error fetching article:", error.message);
    return "";
  }
}

router.post("/", async (req, res) => {
  const { url, promptType, language } = req.body;

  console.log("Received SEO request for URL:", url, language, promptType);

  const content = await extractArticle(url);
  console.log("Extracted content length:", content);

  if (!content) {
    return res.status(400).json({ error: "Could not extract article content." });
  }

  const template = seoPromptTemplates[promptType] || `Analyze this article:\n\n{content}`;
  const basePrompt = template.replace("{content}", content);

  const finalPrompt = `
You are an expert SEO analyst.

⚠️ VERY IMPORTANT INSTRUCTION:
- The entire response MUST be written ONLY in ${language || "English"}
- Do NOT use English unless the selected language is English
- Translate everything including headings, bullets, and structure
- Maintain professional tone in ${language}

----------------------------

${basePrompt}
`;

  try {
    // ✅ Get model from database
    const model = await getGeminiModel();

    console.log(`🤖 Generating SEO analysis...`);

    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text();

    res.json({ 
      success: true,
      reply,
      language: language || "English"
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      success: false,
      error: "Gemini API error", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router;