const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate-news', async (req, res) => {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const generatedContent = response.choices[0]?.message?.content;
    if (!generatedContent) {
      return res.status(500).json({ error: 'No content received from OpenAI' });
    }

    // Extract news details using regex
    const headlineMatch = generatedContent.match(/HEADLINE:\s*(.*?)(?=BODY:|$)/s);
    const bodyMatch = generatedContent.match(/BODY:\s*(.*?)(?=HASHTAGS:|$)/s);
    const hashtagsMatch = generatedContent.match(/HASHTAGS:\s*(.*?)$/s);

    if (!headlineMatch || !bodyMatch || !hashtagsMatch) {
      return res.status(500).json({ error: 'Invalid response format from OpenAI' });
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
    console.error('Error generating news:', error);
    res.status(500).json({ error: 'Failed to generate news. Please try again.' });
  }
});

module.exports = router;