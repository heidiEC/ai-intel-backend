import express from 'express';
import axios from 'axios';
import { parseString } from 'xml2js';
import { analyzeContent } from '../services/aiAnalysis.js';

const router = express.Router();

const RSS_FEEDS = [
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://venturebeat.com/category/ai/feed/',
  'https://artificialintelligence-news.com/feed/'
];

async function fetchRSSFeed(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return null;
  }
}

async function parseXML(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

router.get('/', async (req, res) => {
  try {
    const allArticles = [];
    
    for (const feed of RSS_FEEDS) {
      const xml = await fetchRSSFeed(feed);
      if (xml) {
        const parsed = await parseXML(xml);
        const items = parsed.rss.channel[0].item;
        
        for (const item of items) {
          const article = {
            title: item.title[0],
            description: item.description[0].replace(/<[^>]*>?/gm, ''),
            link: item.link[0],
            pubDate: new Date(item.pubDate[0]),
            source: new URL(item.link[0]).hostname
          };

          // Add AI analysis
          article.analysis = {
            summary: await analyzeContent(article.description)
          };

          allArticles.push(article);
        }
      }
    }

    // Sort by date descending
    allArticles.sort((a, b) => b.pubDate - a.pubDate);
    
    res.json(allArticles);
  } catch (error) {
    console.error('Error processing RSS feeds:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

export default router;