import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function analyzeContent(content) {
  try {
    // Clean and limit content
    const cleanContent = content
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .trim()
      .slice(0, 512);  // Even shorter limit

    console.log('Sending content:', cleanContent.slice(0, 100) + '...');

    // Simpler payload format
    const payload = {
      inputs: cleanContent
    };

    console.log('Sending payload:', JSON.stringify(payload));

    const response = await axios({
      method: 'post',
      url: 'https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-6-6',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: payload,
      timeout: 30000
    });

    console.log('Response:', response.data);

    if (response.data && Array.isArray(response.data)) {
      return response.data[0].summary_text;
    }

    return cleanContent.split('.')[0] + '...';
  } catch (error) {
    console.error('AI Analysis error:', error);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return content.split('.')[0] + '...';
  }
}