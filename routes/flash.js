const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require('openai');

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
   baseURL: "https://api.openai.com/v1"
});

// Function to scrape content
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

// Function to create flashcards
async function createFlashcards(content) {
  try {
    const prompt = process.env.FLASHCARD_PROMPT;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: content },
      ],
      // max_tokens: 1000,
      temperature: 0.7,
    });

    console.log("OpenAI API response:", response);  // Log the entire response object to debug

    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      const flashcardsContent = response.choices[0].message.content;
      console.log(flashcardsContent);
      return flashcardsContent;
    } else {
      throw new Error("Invalid response structure from OpenAI API");
    }

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Error generating flashcards");
  }
}


// API Endpoint for generating flashcards
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
