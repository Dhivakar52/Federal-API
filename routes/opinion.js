const express = require('express');
const axios = require('axios');
const feedparser = require('feedparser');
 
const router = express.Router();
 
// Define the RSS feed URLs
const newsSources = {
  "The Federal": "https://thefederal.com/category/category/opinion/google_feeds.xml",
  "The Federal Andhra": "https://andhrapradesh.thefederal.com/category/opinion/google_feeds.xml",
  "The Federal Telangana": "https://telangana.thefederal.com/category/category/opinion/google_feeds.xml",
  "The Federal Karnataka": "https://karnataka.thefederal.com/category/category/opinion/google_feeds.xml",
  "The Federal Desh": "https://desh.thefederal.com/category/opinion/google_feeds.xml",
  "The Hindu": "https://www.thehindu.com/opinion/feeder/default.rss",
  "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/opinion/rssfeed.xml",
  "Live Mint": "https://www.livemint.com/rss/opinion",
  "The Print": "https://theprint.in/category/opinion/feed/",
  "Economic Times": "https://economictimes.indiatimes.com/opinion/rssfeeds/897228639.cms",
  "The Quint": "https://www.thequint.com/stories.rss?section=opinion",
  "Indian Express": "https://indianexpress.com/section/opinion/feed/",
  "Financial Times": "https://www.ft.com/opinion?format=rss",
  "News 18": "https://www.news18.com/commonfeeds/v1/eng/rss/opinion.xml",
  "Business Standard": "https://www.business-standard.com/rss/opinion-105.rss",
  "Business Line": "https://www.thehindubusinessline.com/opinion/feeder/default.rss",
  "Mid Day": "https://www.mid-day.com/Resources/midday/rss/opinion.xml",
  "Hans India": "https://www.thehansindia.com/category/hans-opinion/feeds.xml",
  "Dainik Bhaskar": "https://www.bhaskar.com/rss-v1--category-1944.xml",
  "Greaterkashmir": "https://www.greaterkashmir.com/opinion/feed/",
  "Kashmirlife": "https://kashmirlife.net/category/forum/feed/",
  "Divyamarathi Bhaskar": "https://divyamarathi.bhaskar.com/rss-v1--category-12019.xml",
  "O TV (Odisha Television)": "https://odishatv.in/opinion/feed"
};
 
// Function to fetch and parse RSS feeds
async function fetchNews(source) {
  try {
    const { data } = await axios.get(source);
    const feed = new feedparser();
    const headlines = [];
    feed.on('data', entry => {
      headlines.push({
        title: entry.title,
        link: entry.link
      });
    });
    feed.end(data);
 
    return headlines.slice(0, 10); // Fetch top 10 headlines
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}
 
router.get('/:source', async (req, res) => {
  const source = req.params.source;
  console.log(source)
  const sourceUrl = newsSources[source];
  console.log(sourceUrl)
  if (sourceUrl) {
    const headlines = await fetchNews(sourceUrl);
    res.json(headlines);
  } else {
    res.status(404).json({ message: 'Source not found' });
  }
});
 
 
module.exports = router;
