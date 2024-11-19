import express from 'express';
import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

// Ensure dotenv is configured
dotenv.config();

const router = express.Router();

// Debug log to check token
console.log('Bot token exists:', !!process.env.SLACK_BOT_TOKEN);
console.log('First few chars of token:', process.env.SLACK_BOT_TOKEN?.substring(0, 5));

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const SLACK_CHANNEL = 'C05MB6B9R8F';

router.get('/', async (req, res) => {
  try {
    console.log('Attempting to fetch Slack messages...');
    console.log('Using token:', process.env.SLACK_BOT_TOKEN ? 'Token exists' : 'No token found');
    console.log('Channel ID:', SLACK_CHANNEL);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const result = await slack.conversations.history({
      channel: SLACK_CHANNEL,
      limit: 100,
      oldest: oneWeekAgo.getTime() / 1000
    });

    console.log('Slack API response:', result);

    if (!result.messages) {
      return res.json([]);
    }

    const messages = result.messages
      .filter(msg => !msg.subtype && msg.text.trim())
      .map(msg => ({
        text: msg.text,
        timestamp: new Date(msg.ts * 1000).toISOString(),
        link: `https://slack.com/archives/${SLACK_CHANNEL}/p${msg.ts.replace('.', '')}`
      }));

    res.json(messages);
  } catch (error) {
    console.error('Detailed Slack error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Slack messages',
      details: error.message 
    });
  }
});

export default router;