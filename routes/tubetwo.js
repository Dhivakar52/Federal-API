const express = require('express');
const ytdlp = require('yt-dlp-exec');
const { getGeminiModel, getCurrentModelName } = require('../constants/gemini'); // ✅ Import from constants
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

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

/* ================= CLEANUP FUNCTION ================= */
async function cleanupTranscript(transcript, language, model) {
  let finalTranscript = transcript;

  // ✅ Cleanup (if enabled)
  if (language !== 'English') {
    const translated = [];
    const chunks = chunkTranscript(finalTranscript);

    for (const chunk of chunks) {
      const prompt = `
Translate to ${language}.
Do NOT change content.
Keep timestamps exactly as in video.
Format: timestamp => sentence

${chunk}
      `.trim();

      try {
        console.log(`🤖 Translating chunk to ${language}...`);
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

  return finalTranscript;
}

/* ================= CHUNK CLEANUP ================= */
async function processChunks(transcript, model, action = 'clean') {
  const processed = [];
  const chunks = chunkTranscript(transcript);

  for (const chunk of chunks) {
    const prompt = action === 'clean' 
      ? `
Fix grammar and punctuation only.
Do NOT change content.
Keep timestamps exactly as in video.
Format: timestamp => sentence

${chunk}
      `.trim()
      : `
Translate to ${action}.
Do NOT change content.
Keep timestamps exactly as in video.
Format: timestamp => sentence

${chunk}
      `.trim();

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      text.split('\n').forEach(line => {
        const [time, ...rest] = line.split('=>');
        if (time && rest.length) {
          processed.push({
            time: time.trim(),
            text: rest.join('=>').trim()
          });
        }
      });
    } catch (err) {
      console.error('Processing error:', err.message);
    }
  }

  return processed;
}

/* -------------------- ROUTE -------------------- */

router.post('/', async (req, res) => {
  try {
    const { youtubeUrl, language = 'English', applyCleaning = true } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'YouTube URL required' 
      });
    }

    console.log(`📥 YouTube URL: ${youtubeUrl}`);
    console.log(`🌐 Target Language: ${language}`);

    /* -------- 1️⃣ VIDEO INFO -------- */
    let info;
    try {
      info = await ytdlp(youtubeUrl, { dumpJson: true });
    } catch (err) {
      console.error('yt-dlp info error:', err.message);
      return res.json({
        success: false,
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

    console.log(`📄 Video Title: ${title}`);

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
        console.log(`✅ Found ${transcript.length} caption segments`);
      }
    } catch (err) {
      console.warn('Subtitle fetch failed:', err.message);
    }

    /* -------- 3️⃣ NO CAPTIONS -------- */
    if (!transcript.length) {
      return res.json({
        success: false,
        title,
        description,
        transcript: [],
        warning: 'No captions available for this video'
      });
    }

    /* -------- 4️⃣ GET MODEL FROM DATABASE -------- */
    const model = await getGeminiModel();
    const modelName = await getCurrentModelName();

    console.log(`🤖 Using model: ${modelName}`);

    /* -------- 5️⃣ GEMINI CLEANUP -------- */
    let finalTranscript = transcript;

    if (applyCleaning) {
      console.log('🧹 Cleaning transcript...');
      finalTranscript = await processChunks(transcript, model, 'clean');
      console.log(`✅ Cleaned ${finalTranscript.length} segments`);
    }

    /* -------- 6️⃣ TRANSLATION -------- */
    if (language !== 'English') {
      console.log(`🌐 Translating to ${language}...`);
      const translated = await processChunks(finalTranscript, model, language);
      finalTranscript = translated;
      console.log(`✅ Translated ${finalTranscript.length} segments`);
    }

    /* -------- 7️⃣ RESPONSE -------- */
    res.json({
      success: true,
      title,
      description,
      transcript: finalTranscript,
      language: language,
      model: modelName,
      totalSegments: finalTranscript.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;