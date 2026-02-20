import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const proxyUrl = 'http://localhost:3000/v1/messages';

async function simulateClaudeCodeRequest() {
  console.log('--- Simulating Claude Code CLI Request ---');
  try {
    const payload = {
      model: process.env.MODEL_USED || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'I need to list the files in this directory.'
        }
      ],
      system: 'You are Claude Code, a helpful CLI assistant.',
      tools: [
        {
          name: 'list_files',
          description: 'List files in the current directory',
          input_schema: {
            type: 'object',
            properties: {
              path: { type: 'string' }
            }
          }
        }
      ],
      betas: ['computer-20241022', 'prompt-caching-2024-07-31']
    };

    console.log(`Sending request to proxy: ${proxyUrl}`);
    const response = await axios.post(proxyUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'anthropic-beta': 'max-tokens-32k-2024-07-15'
      }
    });

    console.log('Response from Proxy (via Ollama/Mock):');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Error simulating request:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

simulateClaudeCodeRequest();
