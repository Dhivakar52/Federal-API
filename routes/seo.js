const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require('openai');

const router = express.Router();

const app = express();


const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
   baseURL: "https://api.openai.com/v1"
});


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
    const response = await openai.chat.completions.create({
       model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert SEO assistant." },
        { role: "user", content: finalPrompt },
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenAI error" });
  }
});

module.exports = router;