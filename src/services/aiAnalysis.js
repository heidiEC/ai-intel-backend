import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function analyzeContent(content) {
  try {
    // Clean and limit content
    const cleanContent = content
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1024);  // Limit to 1024 characters

    console.log('Sending content:', cleanContent.slice(0, 100) + '...'); // Debug log

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-6-6',
      {
        inputs: cleanContent,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Response:', response.data); // Debug log

    return response.data[0].summary_text;
  } catch (error) {
    console.error('AI Analysis error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data); // Debug log
    }
    return content.split('.')[0] + '...';
  }
}