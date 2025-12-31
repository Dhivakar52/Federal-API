// routes/tubetwo.js
const express = require('express');
const ytdlp = require('yt-dlp-exec');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

/* -------------------- HELPERS -------------------- */

// Proper WEBVTT parser
function parseVTT(vtt) {
  return vtt
    .split('\n')
    .reduce((acc, line) => {
      if (line.includes('-->')) {
        acc.push({
          time: line.split('-->')[0].trim(),
          text: ''
        });
      } else if (line.trim() && acc.length) {
        acc[acc.length - 1].text += ' ' + line.trim();
      }
      return acc;
    }, [])
    .filter(item => item.text.trim());
}

// Chunk transcript for Gemini limits
function chunkTranscript(segments, maxChars = 4500) {
  const chunks = [];
  let current = '';
  for (const seg of segments) {
    const line = `${seg.time} => ${seg.text}\n`;
    if (current.length + line.length > maxChars) {
      chunks.push(current);
      current = '';
    }
    current += line;
  }
  if (current) chunks.push(current);
  return chunks;
}

/* -------------------- ROUTE -------------------- */

router.post('/', async (req, res) => {
  try {
    const { youtubeUrl, language = 'English', applyCleaning = true } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }

    /* -------- 1️⃣ Fetch Video Info -------- */
    let info;
    try {
      info = await ytdlp(youtubeUrl, { dumpJson: true });
    } catch (err) {
      console.error('yt-dlp info error:', err.message);
      return res.status(500).json({
        title: 'Video info unavailable',
        description: 'No description',
        transcript: []
      });
    }

    const title = info.title || 'No title';
    const description = (info.description || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/#\w+/g, '')
      .split('\n')
      .filter(Boolean)
      .join('\n');

    /* -------- 2️⃣ Fetch Captions -------- */
    let transcript = [];

    try {
      const subInfo = await ytdlp(youtubeUrl, {
        skipDownload: true,
        writeAutoSub: true,
        subLang: 'en',
        dumpSingleJson: true
      });

      const subsUrl = subInfo?.requested_subtitles?.en?.url;

      if (subsUrl) {
        const r = await fetch(subsUrl);
        const vtt = await r.text();
        transcript = parseVTT(vtt);
      }
    } catch (err) {
      console.warn('Subtitle fetch failed:', err.message);
    }

    /* -------- 3️⃣ No captions → return clean response -------- */
    if (!transcript.length) {
      return res.json({
        title,
        description,
        transcript: [],
        warning: 'No captions available for this video'
      });
    }

    /* -------- 4️⃣ Gemini Cleaning (ONLY real captions) -------- */
    let finalTranscript = transcript;

    if (applyCleaning) {
      finalTranscript = [];
      const chunks = chunkTranscript(transcript);

      for (const chunk of chunks) {
        const prompt = `
You are a subtitle editor.
Fix grammar and punctuation ONLY.
Do NOT add or remove content.
Keep timestamps exactly.
Format: timestamp => sentence

${chunk}
`;
        try {
          const result = await model.generateContent(prompt);
          const cleaned = result.response.text();

          cleaned.split('\n').forEach(line => {
            const [time, ...rest] = line.split('=>');
            if (time && rest.length) {
              finalTranscript.push({
                time: time.trim(),
                text: rest.join('=>').trim()
              });
            }
          });
        } catch (err) {
          console.error('Gemini cleanup error:', err.message);
        }
      }
    }

    /* -------- 5️⃣ Translation (optional) -------- */
    if (language !== 'English') {
      const translated = [];
      const chunks = chunkTranscript(finalTranscript);

      for (const chunk of chunks) {
        const prompt = `
Translate to ${language}.
Do NOT change meaning.
Preserve timestamps exactly.
Format: timestamp => sentence

${chunk}
`;
        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text();

          text.split('\n').forEach(line => {
            const [time, ...rest] = line.split('=>');
            if (time && rest.length) {
              translated.push({
                time: time.trim(),
                text: rest.join('=>').trim()
              });
            }
          });
        } catch (err) {
          console.error('Translation error:', err.message);
        }
      }

      finalTranscript = translated;
    }

    /* -------- 6️⃣ Final Response -------- */
    res.json({
      title,
      description,
      transcript: finalTranscript
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
