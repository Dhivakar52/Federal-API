const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const USER_NEEDS_PROMPT = `
You are a media analyst. Analyze the following news story using the User Needs 2.0 framework.
For each of the 8 user needs listed below, rate how well the story satisfies the need on a scale of 1 to 10. Then give a short explanation for each rating.
User Needs 2.0 categories:
1. Update Me  
2. Educate Me  
3. Give Me Perspective  
4. Keep Me On Trend  
5. Divert Me  
6. Inspire Me  
7. Make Me Feel Responsible  
8. Help Me  
Here’s the story:
{story}
`;

const extractArticleText = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const paragraphs = $("p").map((i, el) => $(el).text()).get();
    const article = paragraphs.join(" ").trim();
    console.log("Extracted article length:", article.length);
    return article;
  } catch (error) {
    console.error("Error extracting article:", error.message);
    return null;
  }
};

router.post("/", async (req, res) => {
  const { url , language  } = req.body;
  console.log(language, url)

  console.log("Received URL:", url);

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const article = await extractArticleText(url);
  if (!article || article.length < 300) {
    return res.status(400).json({
      error: "Could not extract meaningful content. Article too short or empty.",
    });
  }

  // const prompt = USER_NEEDS_PROMPT.replace("{story}", article.slice(0, 3000));
  const basePrompt = USER_NEEDS_PROMPT.replace("{story}", article.slice(0, 3000));

const prompt = `
You are a professional news analyst.

⚠️ STRICT LANGUAGE RULE:
- The entire response MUST be ONLY in ${language || "English"}
- Do NOT use English unless selected
- Translate ratings, headings, explanations everything
- Maintain clarity and structured format

----------------------------

${basePrompt}
`;

  try {
    console.log("Sending prompt to Gemini...");

    // Correct Gemini call
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);

    const text = result.response.text();
    console.log("Gemini response received.");
    res.json({ response: text });
  } catch (err) {
    console.error("Gemini API error full:", err);
    res.status(500).json({
      error: "Gemini request failed",
      details: err?.message,
    });
  }
});

module.exports = router;
