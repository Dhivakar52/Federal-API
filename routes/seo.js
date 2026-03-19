const express = require("express");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const seoPromptTemplates = {
  "Analyze the SEO performance of this article.": `
You are an SEO strategist. Analyze the SEO performance of the given article in a structured, professional report format — exactly like this example.

Each section must begin with an underlined title (use Markdown underline with double underscores like __Title__).  
Maintain professional tone, clarity, and formatting with one blank line between sections.

Follow this exact section order and depth:

__1. URL / Permalink / Slug__  
[Analyze if the URL is descriptive, keyword-rich, too long, or includes unnecessary elements like dates. Suggest a concise, SEO-friendly slug.]

__2. Title & Headings__  
[Evaluate the H1 title for keyword focus, readability, and CTR potential. Analyze use of H2 and H3 tags, hierarchy, keyword inclusion, and clarity.]

__3. Keyword Targeting & Density__  
[Identify primary and secondary keywords. Discuss keyword placement, relevance, and missed opportunities. Suggest better long-tail keyword use.]

__4. Meta Title & Meta Description / Snippet__  
[Assess current meta title and description. Suggest optimized versions within ideal character limits. Ensure focus on primary keywords and CTR.]

__5. Internal & External Linking__  
[Evaluate presence and quality of internal/external links. Mention anchor text optimization and relevance. Suggest improvements.]

__6. Content Depth, Readability & Engagement__  
[Analyze structure, sentence length, tone, depth, and engagement. Discuss scannability and authority-building potential.]

__7. Image ALT Text / Multimedia__  
[Check if images exist and whether ALT tags, captions, and filenames are optimized. Suggest improvements.]

__8. Schema / Structured Data Opportunities__  
[Check for schema presence (Article, NewsArticle, Breadcrumb). Recommend suitable schema markup types and key properties.]

__9. Page Speed, Mobile Experience & Technical SEO__  
[Provide general guidance on image compression, lazy loading, responsive design, canonical tags, and Core Web Vitals.]

__10. Social / Visibility / Sharing__  
[Assess Open Graph tags, Twitter Cards, and shareability. Suggest CTAs or improvements for social visibility.]

__11. Strengths vs Weaknesses Summary__  
[List clear strengths and weaknesses in bullet or table-like format.]

__12. Actionable Checklist / Recommendations__  
[List step-by-step, numbered SEO improvements based on your analysis.]


__13. Checklist Summary__
- Ensure keywords are present in Strap Lines
- Make sure keywords are present in the URL
- Ensure to include keywords in Heading tags like H1, H2, or H3 tags, etc.,
- Have keywords placed in ALT tags for all images
- Add Related Links for each article
- Add keywords in a 2-line snippet of the article.
- Maintain core keywords density with 2-3% in content
- Add related keywords between the content
- Need to add minimum 2 tags under each article
- Articles to be posted under the right sections.
- Important articles need to be listed on Home/Section pages
- Author info (Name were linked to their respective Author Bio page)
- Ensure articles are shared in Social Media (especially on Twitter – Google now showcases in results):
[List step-by-step, numbered SEO improvements based on your Checklist Summary analysis.]


Now, analyze this article and generate the full SEO report in the same style and structure:

{content}
`,

  "Optimize the meta description for this content.": `
Based on the following article, write an SEO-optimized meta description:
- Keep it under 160 characters
- Include the main keyword(s)
- Make it compelling to improve CTR

{content}
`,

  "Provide tips to improve readability for this piece.": `
Analyze the readability of the article below. Give specific, actionable improvements:
- Simplify long sentences
- Break up dense paragraphs
- Add headings or bullet points where needed
- Maintain a natural tone and logical flow

{content}
`,

  "Suggest SEO friendly headlines for the story": `
Based on the article below, generate 5 SEO-friendly headlines:
- Each headline should be under 60 characters
- Include relevant keywords
- Make them catchy but accurate (avoid clickbait)

{content}
`,
};



// 🔍 Extract text from article
async function extractArticle(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const matches = response.data.match(/<p[^>]*>(.*?)<\/p>/g);
    if (!matches) return "";
    return matches
      .map((p) => p.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 5000);
  } catch (error) {
    console.error("Error fetching article:", error.message);
    return "";
  }
}

// 📡 Main API endpoint
router.post("/", async (req, res) => {
  const { url, promptType, language  } = req.body;

  console.log("Received SEO request for URL:",  url , language , promptType);

  const content = await extractArticle(url);
  console.log("Extracted content length:", content);

  if (!content) {
    return res.status(400).json({ error: "Could not extract article content." });
  }

  const template = seoPromptTemplates[promptType] || `Analyze this article:\n\n{content}`;
  const basePrompt = template.replace("{content}", content);
 
const finalPrompt = `
You are an expert SEO analyst.

⚠️ VERY IMPORTANT INSTRUCTION:
- The entire response MUST be written ONLY in ${language || "English"}
- Do NOT use English unless the selected language is English
- Translate everything including headings, bullets, and structure
- Maintain professional tone in ${language}

----------------------------

${basePrompt}
`;

  try {
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Generate SEO analysis content
    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini API error", details: error.message });
  }
});

module.exports = router;
