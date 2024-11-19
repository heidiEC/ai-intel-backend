import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import articlesRouter from './src/routes/articles.js';
import slackRouter from './src/routes/slack.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://yourgithubusername.github.io'
  ]
}));

app.use(express.json());

// Routes
app.use('/api/articles', articlesRouter);
app.use('/api/slack', slackRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'AI Intel API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});