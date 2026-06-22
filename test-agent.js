// test-agent.js — run with: node test-agent.js
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey:  process.env.DEEPSEEK_API_KEY,
});

async function test() {
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user',   content: 'What is the weather in Goa?' }
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather for a city',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string' }
          },
          required: ['city']
        }
      }
    }],
    tool_choice: 'auto',
  });

  console.log('finish_reason:', response.choices[0].finish_reason);
  console.log('tool_calls:', JSON.stringify(response.choices[0].message.tool_calls, null, 2));
}

test().catch(console.error);
