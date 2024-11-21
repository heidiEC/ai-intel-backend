import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function analyzeContent(content) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/pegasus-xsum-tiny',
      {
        inputs: content,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false,
          temperature: 0.7
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

    return response.data[0].summary_text;
  } catch (error) {
    console.error('AI Analysis error:', error);
    const firstSentence = content.split('.')[0];
    return firstSentence + '...';
  }
}