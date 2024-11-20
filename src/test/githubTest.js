import { processUrl } from '../services/urlHandlers.js';

async function testGitHubHandler() {
  try {
    // Test with a real GitHub repo URL
    const testUrl = 'https://github.com/heidiEC/ai-intel-backend';
    console.log('Testing GitHub URL:', testUrl);
    
    const result = await processUrl(testUrl);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGitHubHandler(); 