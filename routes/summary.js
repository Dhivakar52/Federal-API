const express = require('express');
const axios = require('axios');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const cheerio = require('cheerio');

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const languagePrompts = {
  Hindi: 'in Hindi',
  English: 'in English',
  Telugu: 'in Telugu',
  Kannada: 'in Kannada',
  Marathi: 'in Marathi',
  Bengali: 'in Bengali',
  Tamil: 'in Tamil',
  Gujarati: 'in Gujarati',
  Malayalam: 'in Malayalam',
};

router.post('/', async (req, res) => {
  const { url, language } = req.body;
  console.log(url);
  
  // Validate language
  const selectedLanguage = languagePrompts[language] || 'in Hindi'; // Default to Hindi if language is invalid

  try {
    // Fetch the URL content
    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text();
    const paragraphs = $('p').map((i, el) => $(el).text()).get().join('\n');

    console.log('Title:', title);
    console.log('Paragraphs:', paragraphs);

    // Create the prompt for the summarization model
    const prompt = `Summarize the following news article ${selectedLanguage} in about 200 words:\n\n${paragraphs}\n\n`;

    // Call the OpenAI API for summarization
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // You can switch to gpt-3.5-turbo for faster response times
      messages: [
        { role: 'system', content: `You are a skilled news summarizer. Summarize the content ${selectedLanguage}.` },
        { role: 'user', content: prompt },
      ],
    });

    const summary = aiResponse.choices[0].message.content;
    res.json({ summary, title, language: language || 'Hindi' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
