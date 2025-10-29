// routes/tubetwo.js
const express = require('express');
const ytdlp = require('yt-dlp-exec'); // Fetch YouTube info + subs
const { YoutubeTranscript } = require('youtube-transcript'); // Captions
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Load Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

// Helpers
function formatTimestamp(seconds) {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

function cleanDescription(description) {
  if (!description) return '';
  return description
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#\w+/g, '')
    .split('\n')
    .filter(
      (line) =>
        line.trim() &&
        !/(facebook|instagram|twitter|download|app|follow)/i.test(line)
    )
    .join('\n');
}

// Language mapping
const langMap = {
  English: 'en',
  Kannada: 'kn',
  Tamil: 'ta',
  Telugu: 'te',
  Hindi: 'hi',
};

// POST /tubetwo
router.post('/', async (req, res) => {
  try {
    const { youtubeUrl, language = 'English', applyCleaning = true } = req.body;
    if (!youtubeUrl)
      return res.status(400).json({ error: 'YouTube URL required' });

    // Extract video ID
    const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
    if (!videoId)
      return res.status(400).json({ error: 'Invalid YouTube URL' });

    // 1️⃣ Fetch video metadata
    let info;
    try {
      info = await ytdlp(youtubeUrl, { dumpJson: true });
    } catch (err) {
      console.error('Video info fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch video info' });
    }

    const title = info.title || 'No title available';
    const description =
      cleanDescription(info.description) || 'No description available';

    console.log(`Fetched video: ${title}`);

    // 2️⃣ Try youtube-transcript first (array of {time, text})
    let transcript = [];
    try {
      const data = await YoutubeTranscript.fetchTranscript(videoId);
      if (data?.length > 0) {
        transcript = data.map((seg) => ({
          time: formatTimestamp(
            Math.floor(seg.start ?? seg.offset / 1000)
          ),
          text: seg.text,
        }));
        console.log(
          `Transcript pulled via youtube-transcript (${data.length} segments)`
        );
      }
    } catch (err) {
      console.warn('youtube-transcript failed:', err.message);
    }

    // 3️⃣ Fallback to yt-dlp subtitles
    if (transcript.length === 0) {
      try {
        console.log('Trying yt-dlp subtitles...');
        const subInfo = await ytdlp(youtubeUrl, {
          skipDownload: true,
          writeAutoSub: true,
          subLang: 'en',
          dumpSingleJson: true,
        });

        if (subInfo?.requested_subtitles) {
          const subs = subInfo.requested_subtitles.en?.url;
          if (subs) {
            const fetch = (await import('node-fetch')).default;
            const resp = await fetch(subs);
            const text = await resp.text();

            // Parse raw WebVTT to {time, text}
            transcript = text
              .split('\n\n')
              .map((block) => {
                const lines = block.split('\n');
                if (lines.length >= 2) {
                  return {
                    time: lines[0].includes('-->')
                      ? lines[0].split('-->')[0].trim()
                      : '',
                    text: lines.slice(1).join(' '),
                  };
                }
                return null;
              })
              .filter(Boolean);

            console.log('Transcript pulled via yt-dlp subtitles');
          }
        }
      } catch (err) {
        console.warn('yt-dlp subtitles fetch failed:', err.message);
      }
    }

    // 4️⃣ Process with Gemini AI
    let finalTranscript = transcript;

    if (transcript.length > 0) {
      const rawTranscriptText = transcript
        .map((seg) => `${seg.time} => ${seg.text}`)
        .join('\n');

      if (applyCleaning) {
        try {
          const cleanupPrompt = `
You are a professional subtitle editor fluent in ${language}.
Fix grammar and punctuation ONLY. Do not change timestamps or meaning.
Keep this format:
timestamp => sentence
Transcript:
${rawTranscriptText}`;
          const result = await model.generateContent(cleanupPrompt);
          const cleaned = result.response.text();

          // Convert cleaned back into {time, text}
          finalTranscript = cleaned.split('\n').map((line) => {
            const [time, ...rest] = line.split('=>');
            return time && rest.length
              ? { time: time.trim(), text: rest.join('=>').trim() }
              : null;
          }).filter(Boolean);
        } catch (err) {
          console.error('Gemini cleanup failed:', err);
        }
      }

      if (language !== 'English') {
        try {
          const translatePrompt = `
You are a precise translator.

Translate the following YouTube transcript into ${language}, but **do not change, skip, or add any words** other than translating them.
Keep the **timestamps exactly as they are**.

⚠️ Rules:
- Preserve each timestamp and its order.
- Do not modify punctuation or structure.
- Only translate the spoken content (after =>).
- Do not summarize or rephrase anything.

Transcript:
${finalTranscript.map((seg) => `${seg.time} => ${seg.text}`).join('\n')}
`;

          const result = await model.generateContent(translatePrompt);
          const translated = result.response.text();

          // Convert translated back into {time, text}
          finalTranscript = translated.split('\n').map((line) => {
            const [time, ...rest] = line.split('=>');
            return time && rest.length
              ? { time: time.trim(), text: rest.join('=>').trim() }
              : null;
          }).filter(Boolean);
        } catch (err) {
          console.error(`Translation to ${language} failed:`, err);
        }
      }
    } else {
      finalTranscript = [
        { time: '', text: '[No transcript available for this video]' },
      ];
    }

    // 5️⃣ Translate title & description (if needed)
    let translatedTitle = title;
    let translatedDescription = description;

    if (language !== 'English') {
      try {
        const titlePrompt = `
You are a precise translator.
Translate the following YouTube video title into ${language} **without changing any meaning**:
"${title}"
`;

        const descPrompt = `
You are a precise translator.
Translate the following YouTube video description into ${language} **without summarizing or modifying content**:
${description}
`;

        const [titleResult, descResult] = await Promise.all([
          model.generateContent(titlePrompt),
          model.generateContent(descPrompt),
        ]);

        translatedTitle = titleResult.response.text().trim();
        translatedDescription = descResult.response.text().trim();
      } catch (err) {
        console.error(`Title/Description translation to ${language} failed:`, err);
      }
    }

    // 6️⃣ Final response
    res.json({
      title: translatedTitle,
      description: translatedDescription,
      transcript: finalTranscript,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
