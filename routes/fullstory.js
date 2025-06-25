const express = require('express');
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const languagePrompts = {
  Hindi: 'Hindi',
  English: 'English',
  Tamil: 'Tamil',
  Telugu: 'Telugu',
  Kannada: 'Kannada',
  Bengali: 'Bengali',
  Gujarati: 'Gujarati',
  Malayalam: 'Malayalam',
  Marathi: 'Marathi',
};

router.post('/', async (req, res) => {
  const { url, language } = req.body;

  if (!url || !language || !languagePrompts[language]) {
    return res.status(400).json({ error: 'URL and valid language are required' });
  }

  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    const { title, content } = await page.evaluate(() => {
      const title = document.title;
      const elements = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,span'));
      const content = elements
        .map(el => el.innerText.trim())
        .filter(text => text.length > 30)
        .join('\n\n');
      return { title, content };
    });

    await browser.close();

    if (!content || content.length < 100) {
      return res.status(400).json({ error: 'Not enough content found to translate' });
    }

    // Translate using OpenAI
    const translatePrompt = `Translate the following content into ${languagePrompts[language]}:\n\n${content}`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a translator. Translate the content into ${languagePrompts[language]}.`,
        },
        {
          role: 'user',
          content: translatePrompt,
        },
      ],
    });

    const translated = aiResponse.choices[0].message.content;

    res.json({
      url,
      title,
      original: content,
      translated,
      language
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to scrape or translate the page' });
  }
});

module.exports = router;
