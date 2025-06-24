// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// const { OpenAI } = require('openai'); // OpenAI import from 'openai'
// const dotenv = require('dotenv');

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(bodyParser.json());
// const PORT = 3000;

// // OpenAI API Configuration using the OpenAI class from the openai package
// const openai = new OpenAI({
//   apiKey: process.env['OPENAI_API_KEY'],
// });


// // Scrape and summarize endpoint
// app.post('/summarize', async (req, res) => {
//     console.log(req.body)
//   const { url, language } = req.body;

//   try {
//       console.log('Request Body:', req.body);

//       // Scrape content from the URL
//       const response = await axios.get(url);
//       const html = response.data;

//       const cheerio = require('cheerio');
//       const $ = cheerio.load(html);
//       const title = $('title').text();
//       const paragraphs = $('p').map((i, el) => $(el).text()).get().join('\n');

//       console.log('Title:', title);
//       console.log('Paragraphs:', paragraphs);

//       if (!paragraphs.trim()) {
//           throw new Error('No content found to summarize.');
//       }

//       // Language prompts with fallback
//       const languagePrompts = {
//           Hindi: "in Hindi",
//           English: "in English",
//           Telugu: "in Telugu",
//           Kannada: "in Kannada",
//           Marathi: "in Marathi",
//           Bengali: "in Bengali",
//           Tamil: "in Tamil",
//           Gujarati: "in Gujarati",
//           Malayalam: "in Malayalam",
//       };

//       // Check if the language exists in the languagePrompts object
//       const languagePrompt = languagePrompts[language] || "in Hindi"; // Default to English if the language is not found
//      console.log(languagePrompt)
//       const prompt = `Summarize the following news article ${languagePrompt} in about 200 words:\n\n${paragraphs}\n\n`;
//          console.log('Prompt:', prompt);
//       const aiResponse = await openai.chat.completions.create({
//           model: "gpt-4", // Specify the model
//           messages: [
//               { role: "system", content: `You are a skilled news summarizer. Summarize the content ${languagePrompt}.` },
//               { role: "user", content: prompt },
//           ],
//       });

//       console.log('AI Response:', aiResponse); // Log the OpenAI response

//       const summary = aiResponse.choices[0].message.content;

//       res.json({ summary, title });
//   } catch (error) {
//       console.error('Error:', error); // Log the error
//       res.status(500).json({ error: error.message });
//   }
// });

// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));