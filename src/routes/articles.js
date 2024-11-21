import express from 'express';
import axios from 'axios';
import { parseString } from 'xml2js';
import { analyzeContent } from '../services/aiAnalysis.js';

const router = express.Router();

// Define RSS feeds
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
    console.error(`Error fetching RSS feed ${url}:`, error);
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
        
        // Get one week ago timestamp
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Process last week's articles
        for (const item of items) {
          const pubDate = new Date(item.pubDate[0]);
          
          // Only process if article is from last week
          if (pubDate >= oneWeekAgo) {
            const article = {
              title: item.title[0],
              description: item.description[0].replace(/<[^>]*>?/gm, ''),
              link: item.link[0],
              pubDate: pubDate,
              source: new URL(item.link[0]).hostname
            };

            try {
              console.log('Processing article:', article.title);
              article.summary = await analyzeContent(article.description);
            } catch (error) {
              console.error('Error analyzing article:', article.title, error);
              article.summary = article.description.split('.')[0] + '...';
            }

            allArticles.push(article);
          }
        }
      }
    }

    console.log(`Returning ${allArticles.length} articles`);
    allArticles.sort((a, b) => b.pubDate - a.pubDate);
    res.json(allArticles);
  } catch (error) {
    console.error('Error processing RSS feeds:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

export default router;