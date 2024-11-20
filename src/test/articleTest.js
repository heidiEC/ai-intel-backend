import dotenv from 'dotenv';
import { processUrl } from '../services/urlHandlers.js';

dotenv.config();

async function testArticleHandler() {
  try {
    const testUrls = [
      'https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif',
      'https://medium.com/@martin_bielik/all-you-need-to-know-about-node-js-v21-6aae3165b814'
    ];

    for (const url of testUrls) {
      console.log('\n-----------------------------------');
      console.log('Testing Article URL:', url);
      const result = await processUrl(url);
      console.log('Result:', JSON.stringify(result, null, 2));
    }

    console.log('\n-----------------------------------');
    console.log('Testing ArXiv URL: https://arxiv.org/abs/2311.02076');
    try {
      const result = await processUrl('https://arxiv.org/abs/2311.02076');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error testing ArXiv URL:', error);
    }

    // Test an invalid ArXiv URL
    console.log('\n-----------------------------------');
    console.log('Testing Invalid ArXiv URL: https://arxiv.org/abs/0000.00000');
    try {
      const result = await processUrl('https://arxiv.org/abs/0000.00000');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error testing invalid ArXiv URL:', error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testArticleHandler(); 