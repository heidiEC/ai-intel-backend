import axios from 'axios';

const MODEL = 'Falconsai/text_summarization';

function createPrompt(content) {
  const limitedContent = content.slice(0, 1000);
  
  return `Summarize this content in 1-2 clear sentences:

${limitedContent}

Focus on the key points and findings. Ignore metadata like dates and sources.`;
}

async function analyzeContent(content) {
  try {
    const prompt = createPrompt(content);
    
    // Try up to 3 times in case of model loading
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${MODEL}`,
          { 
            inputs: prompt,
            parameters: {
              max_length: 100,
              min_length: 30,
              temperature: 0.3,
              num_beams: 4,
              no_repeat_ngram_size: 3,
              early_stopping: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        );

        let summary = response.data[0]?.summary_text || response.data[0]?.generated_text;
        if (!summary) {
          throw new Error('No summary in response');
        }

        return summary.substring(0, 400);

      } catch (error) {
        if (error.response?.status === 503 && attempt < 3) {
          const waitTime = 5000;  // Wait 5 seconds between attempts
          console.log(`Model loading, attempt ${attempt}/3. Waiting ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to get summary after 3 attempts');

  } catch (error) {
    console.error('Error analyzing content:', error);
    return 'AI analysis not available - ' + error.message;
  }
}

export { analyzeContent };