import express from 'express';
import { WebClient } from '@slack/web-api';
import { processUrl } from '../services/urlHandlers.js';

const router = express.Router();
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const SLACK_CHANNEL = 'C05MB6B9R8F';

router.get('/', async (req, res) => {
  try {
    // Get today's timestamp (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await slack.conversations.history({
      channel: SLACK_CHANNEL,
      limit: 100,
      oldest: today.getTime() / 1000  // Changed from oneWeekAgo to today
    });

    console.log(`Fetched ${result.messages?.length || 0} messages from today`);

    if (!result.messages) {
      return res.json([]);
    }

    // Process URLs using our comprehensive handlers
    const processedMessages = await Promise.all(
      result.messages
        .filter(msg => !msg.subtype && msg.text.includes('http'))
        .map(async msg => {
          // Extract URLs and clean them
          const urls = msg.text.match(/https?:\/\/[^\s]+/g) || [];
          
          if (urls.length > 0) {
            try {
              // Clean the URL by removing trailing characters and punctuation
              const cleanUrl = urls[0]
                .replace(/[>.,;]$/, '')  // Remove trailing punctuation
                .replace(/\/$/, '');     // Remove trailing slash
              
              console.log('Processing URL:', cleanUrl);  // Debug log
              
              const metadata = await processUrl(cleanUrl);
              if (metadata) {
                return {
                  ...metadata,
                  timestamp: new Date(msg.ts * 1000).toISOString(),
                  slackLink: `https://slack.com/archives/${SLACK_CHANNEL}/p${msg.ts.replace('.', '')}`
                };
              }
            } catch (error) {
              console.error('Error processing URL:', urls[0], error);
            }
          }
          return null;
        })
    );

    // Filter out null results and send response
    const validMessages = processedMessages.filter(msg => msg !== null);
    console.log(`Returning ${validMessages.length} processed messages`);  // Debug log
    
    res.json(validMessages);
  } catch (error) {
    console.error('Detailed Slack error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Slack messages',
      details: error.message 
    });
  }
});

export default router;