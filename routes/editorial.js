const express = require('express');
const axios = require('axios');
const feedparser = require('feedparser');
 
const router = express.Router();
 
// Define the RSS feed URLs
const newsSources = {
  "The Hindu": "https://www.thehindu.com/opinion/editorial/feeder/default.rss",
  "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/editorials/rssfeed.xml",
  "Economic Times": "https://economictimes.indiatimes.com/opinion/et-editorial/rssfeeds/3376910.cms",
  "Indian Express": "https://indianexpress.com/section/opinion/editorials/feed/",
  "Business Standard": "https://www.business-standard.com/rss/opinion/editorial-10501.rss",
  "Business Line": "https://www.thehindubusinessline.com/opinion/editorial/feeder/default.rss",
  "Hans India": "https://www.thehansindia.com/category/hans-opinion-editorial/feeds.xml",
  "Live Hindustan": "https://api.livehindustan.com/feeds/rss/blog/editorial/rssfeed.xml",
  "Mathrubhumi": "https://www.mathrubhumi.com/cmlink/rss-feed-1.7275970",
  "Kashmirlife": "https://kashmirlife.net/category/editorial/feed/",
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
 
