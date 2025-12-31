// routes/tubetwo.js
const express = require('express');
const ytdlp = require('yt-dlp-exec');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

// Helpers
function formatTimestamp(seconds) {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    : `${m}:${s.toString().padStart(2,'0')}`;
}

function chunkTranscript(segments, maxChars = 5000) {
  const chunks = [];
  let current = [];
  let size = 0;
  for (const seg of segments) {
    const line = `${seg.time} => ${seg.text}\n`;
    if (size + line.length > maxChars) {
      chunks.push(current.join(''));
      current = [];
      size = 0;
    }
    current.push(line);
    size += line.length;
  }
  if (current.length) chunks.push(current.join(''));
  return chunks;
}

// POST /tubetwo
router.post('/', async (req,res) => {
  try {
    const { youtubeUrl, language = 'English', applyCleaning = true } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: 'YouTube URL required' });

    const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

    // 1️⃣ Fetch video info
    let info;
    try { info = await ytdlp(youtubeUrl,{ dumpJson: true }); } 
    catch(err){ console.error('Video info fetch error:', err); return res.status(500).json({error:'Failed to fetch video info'}); }

    const title = info.title || 'No title';
    const description = (info.description || 'No description').replace(/https?:\/\/\S+/g,'').replace(/#\w+/g,'').split('\n').filter(l=>l.trim()).join('\n');
    
    // 2️⃣ Fetch subtitles using yt-dlp
    let transcript = [];
    try {
      const subInfo = await ytdlp(youtubeUrl,{ skipDownload:true, writeAutoSub:true, subLang:'en', dumpSingleJson:true });
      const subsUrl = subInfo.requested_subtitles?.en?.url;
      if(subsUrl){
        const res = await fetch(subsUrl);
        const text = await res.text();
        transcript = text.split('\n\n').map(block=>{
          const lines = block.split('\n');
          if(lines.length>=2) return { time: lines[0].includes('-->')?lines[0].split('-->')[0].trim():'', text: lines.slice(1).join(' ') };
          return null;
        }).filter(Boolean);
      }
    } catch(err){ console.warn('yt-dlp subtitles fetch failed:', err.message); }

    if(transcript.length===0) transcript=[{time:'', text:'[No transcript available]'}];

    // 3️⃣ Clean / Translate with Gemini AI
    let finalTranscript = [];
    const chunks = chunkTranscript(transcript);

    for(const chunk of chunks){
      if(applyCleaning){
        try{
          const cleanupPrompt = `You are a professional subtitle editor fluent in ${language}. Fix grammar and punctuation ONLY. Keep timestamps. Format: timestamp => sentence. Transcript:\n${chunk}`;
          const result = await model.generateContent(cleanupPrompt);
          const cleaned = result.response.text();
          cleaned.split('\n').forEach(line=>{
            const [time,...rest]=line.split('=>');
            if(time && rest.length) finalTranscript.push({ time: time.trim(), text: rest.join('=>').trim() });
          });
        }catch(err){ console.error('Gemini cleanup failed:', err.message); }
      } else finalTranscript = transcript;
    }

    if(language !== 'English' && finalTranscript.length>0){
      const translatedTranscript = [];
      for(const chunk of chunkTranscript(finalTranscript)){
        try{
          const translatePrompt = `You are a precise translator. Translate into ${language}, do NOT skip/add words. Preserve timestamps exactly. Transcript:\n${chunk}`;
          const result = await model.generateContent(translatePrompt);
          const translated = result.response.text();
          translated.split('\n').forEach(line=>{
            const [time,...rest]=line.split('=>');
            if(time && rest.length) translatedTranscript.push({ time: time.trim(), text: rest.join('=>').trim() });
          });
        }catch(err){ console.error(`Translation failed: ${err.message}`); }
      }
      finalTranscript = translatedTranscript;
    }

    res.json({ title, description, transcript: finalTranscript });

  } catch(err){ console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
