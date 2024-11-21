import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function analyzeContent(content) {
  try {
    if (!content || content.length < 50) {
      return 'Content too short for analysis';
    }

    // Truncate content to prevent API overload
    const truncatedContent = content.substring(0, 1000);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        inputs: truncatedContent,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data?.[0]?.summary_text || 'Analysis failed to produce summary';
  } catch (error) {
    console.error('AI Analysis error:', error);
    return 'Unable to analyze content at this time';
  }
}