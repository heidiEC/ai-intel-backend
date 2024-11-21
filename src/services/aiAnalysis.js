import axios from 'axios';

export async function analyzeContent(content) {
  try {
    // Clean and limit content
    const cleanContent = content
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 512);

    const requestData = {
      inputs: cleanContent
    };

    const response = await axios({
      method: 'post',
      url: 'https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-6-6',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
      timeout: 30000
    });

    return response.data[0].summary_text;
  } catch (error) {
    console.error('AI Analysis error:', error);
    return content.split('.')[0] + '...';
  }
}