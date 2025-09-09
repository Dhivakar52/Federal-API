const express = require("express");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const seoPromptTemplates = {
  "Analyze the SEO performance of this article.": `
Analyze the SEO performance of the following article. Evaluate:
- Title & meta description
- Headers structure
- Keyword usage
- Links
- Image SEO
- Readability
- Schema markup (if applicable)

Then give actionable suggestions to improve SEO performance.

{content}`,
  "Optimize the meta description for this content.": `
Based on the following article content, write an SEO-optimized meta description:
- Keep it under 160 characters
- Include the main keyword(s)
- Make it compelling and relevant to improve click-through rate (CTR)

{content}`,
  "Provide tips to improve readability for this piece.": `
Analyze the readability of the following article content. Identify any issues and suggest clear, actionable improvements:
- Use simpler language or sentence structure
- Break up long paragraphs
- Add headings or bullet points where needed
- Ensure the tone and flow are easy to follow

{content}`,
  "Suggest SEO friendly headlines for the story": `
Based on the article below, generate 5 SEO-friendly, engaging headlines:
- Include relevant keywords
- Each headline should be under 60 characters
- Make them click-worthy but accurate
- Avoid clickbait; reflect the article content clearly

{content}`,
};

// 🔍 Extract text from article
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

// 📡 Main API endpoint
router.post("/", async (req, res) => {
  const { url, promptType } = req.body;

  const content = await extractArticle(url);
  console.log("Extracted content length:", content);

  if (!content) {
    return res.status(400).json({ error: "Could not extract article content." });
  }

  const template = seoPromptTemplates[promptType] || `Analyze this article:\n\n{content}`;
  const finalPrompt = template.replace("{content}", content);

  try {
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate SEO analysis content
    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini API error", details: error.message });
  }
});

module.exports = router;
