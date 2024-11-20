# AI Intel Backend

Backend service for the AI Intelligence NL App, providing API endpoints for article and Slack message analysis.

## Features

- GitHub repository analysis
- Slack message integration
- Article summarization
- Natural language processing
- AI-powered content analysis

## Tech Stack

- Node.js/Express
- HuggingFace AI models
- Slack API integration
- GitHub API integration

## API Endpoints

- `/api/articles` - Fetches and analyzes articles
- `/api/slack` - Processes Slack messages and extracts linked content

## Environment Setup

Required environment variables:

env
SLACK_BOT_TOKEN=your_slack_token
HUGGING_FACE_API_KEY=your_huggingface_token
GITHUB_TOKEN=your_github_
token
PORT=3001
