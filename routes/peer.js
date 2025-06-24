const express = require('express');
const axios = require('axios');
const feedparser = require('feedparser');

const router = express.Router();

// Define the RSS feed URLs
const newsSources = {
  "ABP News": "https://www.abplive.com/home/feed",
  "BBC India": "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml",
  "Business Line": "https://www.thehindubusinessline.com/feeder/default.rss",
  "Deccan Chronicle": "https://www.deccanchronicle.com/google_feeds.xml",
  "Gujarati- Gujarat Samachar": "https://www.gujaratsamachar.com/rss/top-stories",
  "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml",
  "India Today": "https://www.indiatoday.in/rss/home",
  "Indian Express": "https://indianexpress.com/section/india/feed",
  "Live Mint": "https://www.livemint.com/rss/news",
  "Money Control": "https://www.moneycontrol.com/rss/latestnews.xml",
  "Manorama - English": "https://www.onmanorama.com/kerala.feeds.onmrss.xml",
  "NDTV": "https://feeds.feedburner.com/NDTV-LatestNews",
  "News 18": "https://www.news18.com/commonfeeds/v1/eng/rss/india.xml",
  "Telangana Today": "https://telanganatoday.com/feed",
  "The Federal": "https://thefederal.com/feeds.xml",
  "The Federal Andhra": "https://andhrapradesh.thefederal.com/feeds.xml",
  "The Federal Desh": "https://desh.thefederal.com/feeds.xml",
  "The Federal Karnataka": "https://karnataka.thefederal.com/feeds.xml",
  "The Federal Telangana": "https://telangana.thefederal.com/feeds.xml",
  "The Hindu": "https://www.thehindu.com/feeder/default.rss",
  "Times of India": "https://timesofindia.indiatimes.com/rssfeedmostrecent.cms"
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