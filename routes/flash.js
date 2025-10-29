const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Scraping function
async function scrapeContent(url) {
  try {
    console.log("Scraping content from:", url);
    const { data, status } = await axios.get(url);
    if (status !== 200) {
      throw new Error(`Failed to fetch content. Status code: ${status}`);
    }

    const $ = cheerio.load(data);
    const title = $("title").text();
    const paragraphs = $("p")
      .map((_, el) => $(el).text())
      .get()
      .join("\n");

    console.log("Scraped Title:", title);
    return { title, content: paragraphs };
  } catch (error) {
    console.error("Error scraping content:", error);
    throw new Error("Error scraping content");
  }
}

// Flashcard generation function (Gemini)
async function createFlashcards(content) {
  try {
    const prompt = process.env.FLASHCARD_PROMPT;

    // Initialize model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Gemini takes plain text instead of role-based messages
      const inputText = `
         ${prompt}

Here is the article content:
${content}
`;

    const result = await model.generateContent(inputText);

    // Extract response
    const flashcardsContent = result.response.text();
    console.log(flashcardsContent);

    return flashcardsContent;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Error generating flashcards");
  }
}

// API endpoint
router.post("/", async (req, res) => {
  const { url } = req.body;
  console.log(url);

  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const { title, content } = await scrapeContent(url);
    console.log(title, content);

    const flashcards = await createFlashcards(content);
    res.json({ title, flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

module.exports = router;
