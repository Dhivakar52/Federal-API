const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const { OpenAI } = require("openai");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
  baseURL: "https://api.openai.com/v1"
});

// System prompt to ensure strict translation
const systemPrompt = `You are a professional translator. You will be given plain article content and a target language. Your task is to ONLY translate the content into the requested language without adding, removing, rephrasing, formatting, or summarizing anything. Just provide the raw translated version.`;

router.post("/", async (req, res) => {
  try {
    const { url, language } = req.body;

    // Fetch the web page
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Remove unwanted tags
    $("script, style, img, input, nav, footer, aside").remove();

    let content = "";

    // Extract text from headings, paragraphs, divs, and spans
    const selectors = "h1, h2, h3, h4, h5, h6, p, div, span";
    $(selectors).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) content += `${text}\n`;
    });

    content = content.trim();

    // User prompt for translation
    const userPrompt = `Translate the following article into ${language}. Only provide the translated version. No explanation. No additional content:\n\n${content}`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
    });

    const translated = result.choices[0].message.content;

    res.json({
      translated,
    });

  } catch (error) {
    console.error("Translation Error:", error.message);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
