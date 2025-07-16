// routes/translateRoute.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
   baseURL: "https://api.openai.com/v1"
});


// Function to extract article content
async function extractArticle(url) {
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);


  const title = $("title").first().text();
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  // const paragraphs = $("p")
  //   .map((_, el) => $(el).text())
  //   .get()
  //   .join("\n\n");
    const htmlContent = $("h1, h2, h3, h4, h5, h6, p,div,span")
    .map((_, el) => $(el).text())
    .get()
    .join("\n");
    console.log(htmlContent)

  return { title, description, text: htmlContent };
}









// Function to translate text using OpenAI
async function translateText(text, language) {
  // const prompt = `Translate the following article into ${language} language fully . I want all tags inside the data  separate the p tag and h1 to h6 content in new-line.But I dont html tags inside the contents .  Only provide the translated version. No explanation. No additional content:\n\n${text}`;

const prompt = `
Translate the following article into ${language}.
- Do not include any HTML tags.
- For headings (h1-h6), place them on a separate line.
- For each paragraph, place it on a new line.
- Do not explain anything. Only return the translated and structured content.

Here is the content:
\n\n${text}
`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a translator." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
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

    // Return only translated content — no file download
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
