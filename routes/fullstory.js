const express = require('express');
const puppeteer = require('puppeteer');

const router = express.Router();

const languagePrompts = {
  Hindi: 'hi',
  English: 'en',
  Tamil: 'ta',
  Telugu: 'te',
  Kannada: 'kn',
  Bengali: 'bn',
  Gujarati: 'gu',
  Malayalam: 'ml',
  Marathi: 'mr',
};

let translateFn = null;

// Correct dynamic import
(async () => {
  try {
    const module = await import('@vitalets/google-translate-api');
    translateFn = module.default?.translate || module.translate; // ✅ check for translate method
    if (!translateFn) {
      throw new Error('translate function not found in module');
    }
    console.log('✅ Translation module initialized');
  } catch (err) {
    console.error('❌ Failed to load translation module:', err);
  }
})();

router.post('/', async (req, res) => {
  const { url, language } = req.body;

  if (!url || !language || !languagePrompts[language]) {
    return res.status(400).json({ error: 'URL and valid language are required' });
  }

  if (!translateFn) {
    return res.status(500).json({
      error: 'Translation service not ready. Please try again shortly.',
    });
  }

  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  
    


   const { title, content } = await page.evaluate(() => {
  const title = document.querySelector('h1')?.innerText || document.title;

  // Look for common article containers
  const articleContainer =
    document.querySelector('article') ||
    document.querySelector('[class*="article"]') ||
    document.querySelector('[class*="content"]') ||
    document.querySelector('[class*="story"]') ||
    document.querySelector('[class*="main"]') ||
    document.body;

  const paragraphs = Array.from(articleContainer.querySelectorAll('p, h2, h3'));
  const content = paragraphs
    .map(el => el.innerText.trim())
    .filter(text => text.length > 40)
    .join('\n\n');

  return { title, content };
});


    await browser.close();

    if (!content || content.length < 100) {
      return res.status(400).json({ error: 'Not enough content to translate' });
    }

    const safeContent = content.length > 5000 ? content.slice(0, 5000) : content;

    const result = await translateFn(safeContent, {
      to: languagePrompts[language],
    });

    res.json({
      url,
      title,
      original: content,
      translated: result.text,
      language,
    });

  } catch (error) {
    console.error('❌ Error during translation:', error);
    res.status(500).json({
      error: 'Failed to translate content',
      details: error.message,
    });
  }
});

module.exports = router;