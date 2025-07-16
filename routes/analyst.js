const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require('openai');

const router = express.Router();

const app = express();


const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
   baseURL: "https://api.openai.com/v1"
});



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
    const paragraphs = $('p').map((i, el) => $(el).text()).get();
    return paragraphs.join(' ').trim();
  } catch (error) {
    return null;
  }
};

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const article = await extractArticleText(url);
  if (!article || article.length < 300) {
    return res.status(400).json({ error: 'Could not extract meaningful content.' });
  }

  const prompt = USER_NEEDS_PROMPT.replace('{story}', article.slice(0, 3000));

  try {
    const chatResponse = await openai.chat.completions.create({
       model: "gpt-4o-mini",
      messages: [
        { role: 'system', content: 'You are a helpful media analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const result = chatResponse.choices[0].message.content;
    res.json({ response: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});


module.exports = router;