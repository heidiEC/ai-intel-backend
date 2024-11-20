import express from 'express';
import dotenv from 'dotenv';
import articlesRouter from './src/routes/articles.js';
import slackRouter from './src/routes/slack.js';

dotenv.config();
const app = express();

// CORS middleware
app.use((req, res, next) => {
  // Allow both GitHub Pages and localhost
  const allowedOrigins = ['https://heidiec.github.io', 'http://localhost:3000'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Required headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use('/api/articles', articlesRouter);
app.use('/api/slack', slackRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
});