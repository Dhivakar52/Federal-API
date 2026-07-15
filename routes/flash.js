const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { getGeminiModel, getCurrentModelName } = require("../constants/gemini");

const router = express.Router();

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

// Flashcard generation function
async function createFlashcards(content, language = "English") {
  try {
    const prompt = process.env.FLASHCARD_PROMPT;

    // ✅ Get model from database
    const model = await getGeminiModel();
    const modelName = await getCurrentModelName();

    const inputText = `
You are an expert educator.

⚠️ VERY STRICT LANGUAGE RULE:
- Generate flashcards ONLY in ${language}
- Do NOT mix English unless selected
- Translate EVERYTHING (questions, answers)

----------------------------

${prompt}

Here is the article content:
${content}
`;

    console.log(`🤖 Generating flashcards with model: ${modelName}`);
    const result = await model.generateContent(inputText);

    const flashcardsContent = result.response.text();
    console.log("✅ Flashcards generated successfully");

    return { flashcards: flashcardsContent, modelName };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Error generating flashcards");
  }
}

// API endpoint
router.post("/", async (req, res) => {
  const { url, language } = req.body;
  console.log("📥 Request received:", { url, language });

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const { title, content } = await scrapeContent(url);
    console.log("📄 Scraped content length:", content.length);

    const { flashcards, modelName } = await createFlashcards(content, language);
    
    res.json({ 
      success: true,
      title, 
      flashcards,
      language: language || "English",
      model: modelName  // ✅ Include model name in response
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

module.exports = router;