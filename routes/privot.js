const express = require('express');
const { getGeminiModel, getCurrentModelName } = require('../constants/gemini');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// ✅ Translation function
async function translateText(input, selectedLanguage) {
  try {
    const model = await getGeminiModel();
    const modelName = await getCurrentModelName();

    const prompt = `As a News Desk Editor for The Federal (www.thefederal.com), transform the following press release into a news article. 
The article should be objective, well-structured, and maintain journalistic standards. 
If the target language is not English, translate it appropriately while preserving context, accuracy, and cultural nuances.

⚠️ STRICT LANGUAGE RULE:
- Response MUST be in ${selectedLanguage}
- Do NOT mix English unless selected

Press Release:
${input}

Target Language: ${selectedLanguage}

Please provide a news article that:
1. Has a clear headline
2. Follows news writing best practices
3. Maintains objectivity
4. Includes relevant context
5. Generates hashtags and relevant SEO-focused keywords
6. Is written in ${selectedLanguage} with proper cultural context`;

    console.log(`🤖 Translating with model: ${modelName}`);
    console.log(`📝 Target Language: ${selectedLanguage}`);

    const result = await model.generateContent(prompt);
    const article = result.response.text();

    return { article, modelName };
  } catch (error) {
    console.error("Error in translate function:", error);
    throw error;
  }
}

router.post("/", async (req, res) => {
  try {
    const { input, selectedLanguage } = req.body;

    if (!input) {
      return res.status(400).json({ 
        success: false,
        error: "Input text is required." 
      });
    }

    console.log(`📥 Translation request received`);
    console.log(`📝 Input length: ${input.length}`);
    console.log(`🌐 Language: ${selectedLanguage || 'English'}`);

    const { article, modelName } = await translateText(
      input, 
      selectedLanguage || 'English'
    );

    res.json({ 
      success: true,
      output: article,
      model: modelName,
      language: selectedLanguage || 'English'
    });
    
  } catch (error) {
    console.error("❌ Error generating article:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate article.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;