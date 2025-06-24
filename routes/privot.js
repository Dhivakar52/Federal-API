const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { input, selectedLanguage } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input text is required." });
    }

    const prompt = `As a News Desk Editor for The Federal (www.thefederal.com), transform the following press release into a news article. The article should be objective, well-structured, and maintain journalistic standards. If the target language is not English, translate it appropriately while preserving context, accuracy, and cultural nuances.

    Press Release:
    ${input}

    Target Language: ${selectedLanguage}

    Please provide a news article that:
    1. Has a clear headline
    2. Follows news writing best practices
    3. Maintains objectivity
    4. Includes relevant context
    5. Generate hashtags and relevant SEO-focused keywords
    6. Is written in ${selectedLanguage} with proper cultural context`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
    });

    res.json({ output: completion.choices[0]?.message?.content || "" });
  } catch (error) {
    console.error("Error generating article:", error);
    res.status(500).json({ error: "Failed to generate article." });
  }
});

module.exports = router;