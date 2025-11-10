'use strict';

// openai client via openrouter - swap for internal model in prod
async function createOpenAIClient() {
  const { default: OpenAI } = await import('openai');
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://querylens.app',
      'X-Title': 'QueryLens Web3 Support Triage',
    },
  });
}

function handleError(error) {
  console.error('[QueryLens API Error]', error);

  if (error.status === 429) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Rate limit reached. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
      }),
    };
  }

  if (error.status === 401) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'API key is invalid or missing. Check your configuration.',
        code: 'AUTH_ERROR',
      }),
    };
  }

  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'Something went wrong processing your request. Please try again.',
      code: 'INTERNAL_ERROR',
    }),
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

function successResponse(data) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

module.exports = {
  createOpenAIClient,
  handleError,
  parseBody,
  successResponse,
};
