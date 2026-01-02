const express = require('express');
const ytdlp = require('yt-dlp-exec');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

/* -------------------- GEMINI -------------------- */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

/* -------------------- HELPERS -------------------- */

// Robust WEBVTT parser
function parseVTT(vtt) {
  const blocks = vtt.split('\n\n');

  return blocks
    .map(block => {
      const lines = block.split('\n').map(l => l.trim());
      const timeLine = lines.find(l => l.includes('-->'));
      if (!timeLine) return null;

      const time = timeLine.split('-->')[0].trim();
      const text = lines
        .filter(l => l && !l.includes('-->') && !l.startsWith('WEBVTT'))
        .join(' ')
        .trim();

      return text ? { time, text } : null;
    })
    .filter(Boolean);
}

// Chunk transcript for Gemini token limits
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

    /* -------- 1️⃣ VIDEO INFO -------- */
    let info;
    try {
      info = await ytdlp(youtubeUrl, { dumpJson: true });
    } catch (err) {
      console.error('yt-dlp info error:', err.message);
      return res.json({
        title: 'Video info unavailable',
        description: '',
        transcript: [],
        warning: 'Unable to fetch video metadata'
      });
    }

    const title = info.title || 'No title';
    const description = (info.description || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/#\w+/g, '')
      .split('\n')
      .filter(Boolean)
      .join('\n');

    /* -------- 2️⃣ CAPTION FETCH -------- */
    let transcript = [];

    try {
      const subInfo = await ytdlp(youtubeUrl, {
        skipDownload: true,
        writeAutoSubs: true,
        writeSubs: true,
        subFormat: 'vtt',
        dumpSingleJson: true
      });

      const subs = subInfo?.requested_subtitles || {};
      const firstLang = Object.keys(subs)[0];

      if (firstLang && subs[firstLang]?.url) {
        const r = await fetch(subs[firstLang].url);
        const vtt = await r.text();
        transcript = parseVTT(vtt);
      }
    } catch (err) {
      console.warn('Subtitle fetch failed:', err.message);
    }

    /* -------- 3️⃣ NO CAPTIONS -------- */
    if (!transcript.length) {
      return res.json({
        title,
        description,
        transcript: [],
        warning: 'No captions available for this video'
      });
    }

    /* -------- 4️⃣ GEMINI CLEANUP -------- */
    let finalTranscript = transcript;

    if (applyCleaning) {
      finalTranscript = [];
      const chunks = chunkTranscript(transcript);

      for (const chunk of chunks) {
        const prompt = `
Fix grammar and punctuation only.
Do NOT any content change content.
Keep timestamps exactly what in this video.
Format: timestamp => sentence

${chunk}
        `.trim();

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

    /* -------- 5️⃣ TRANSLATION -------- */
    if (language !== 'English') {
      const translated = [];
      const chunks = chunkTranscript(finalTranscript);

      for (const chunk of chunks) {
        const prompt = `
Translate to ${language}.
Do NOT any content change content.
Keep timestamps exactly what in this video.
Format: timestamp => sentence

${chunk}
        `.trim();

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

    /* -------- 6️⃣ RESPONSE -------- */
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
