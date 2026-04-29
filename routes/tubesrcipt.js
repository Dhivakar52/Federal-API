const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { title, description, transcript, language } = req.body;

    if (!title || !description || !transcript) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const systemPrompt = `You are a professional news writer fluent in ${language}. Follow journalistic standards strictly:
1. Use proper script and grammar.
2. Do not mix languages.`;

    const userPrompt = `Generate a news story in ${language}:
Title: ${title}
Description: ${description}
Transcript: ${transcript}

Format:
HEADLINE: (headline)
BODY: (article)
HASHTAGS: (hashtags)`;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", });

    // Generate content
    const result = await model.generateContent({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
    });

    const generatedContent = result.response.text();
    if (!generatedContent) {
      return res.status(500).json({ error: 'No content received from Gemini' });
    }

    // Extract news details using regex
    const headlineMatch = generatedContent.match(/HEADLINE:\s*(.*?)(?=BODY:|$)/s);
    const bodyMatch = generatedContent.match(/BODY:\s*(.*?)(?=HASHTAGS:|$)/s);
    const hashtagsMatch = generatedContent.match(/HASHTAGS:\s*(.*?)$/s);

    if (!headlineMatch || !bodyMatch || !hashtagsMatch) {
      return res.status(500).json({ error: 'Invalid response format from Gemini' });
    }

    res.json({
      headline: headlineMatch[1].trim(),
      body: bodyMatch[1].trim(),
      hashtags: hashtagsMatch[1]
        .split(',')
        .map(tag => `#${tag.trim()}`)
        .slice(0, 5),
    });

  } catch (error) {
    console.error('Gemini News Generator Error:', error);
    res.status(500).json({ error: 'Failed to generate news. Please try again.', details: error.message });
  }
});

module.exports = router;
