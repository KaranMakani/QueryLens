// api layer - multi-stage calls to the backend

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function apiCall(endpoint, body, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        data.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 'TIMEOUT', 408);
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Unable to reach the server. Check your connection.',
      'NETWORK_ERROR',
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function detectIntent(query, conversationHistory = []) {
  return apiCall('intent-detect', { query, conversationHistory });
}

export async function extractInfo(query, conversationHistory = []) {
  return apiCall('extract-info', { query, conversationHistory });
}

export async function generateTriage(intent, entities, query, conversationHistory = []) {
  return apiCall('triage', { intent, entities, query, conversationHistory });
}

export async function generateReply(triage, intent, entities) {
  return apiCall('generate-reply', { triage, intent, entities });
}

// runs the full 4-stage pipeline in sequence
export async function runFullPipeline(query, conversationHistory = []) {
  const intentResult = await detectIntent(query, conversationHistory);
  const extractionResult = await extractInfo(query, conversationHistory);
  const triageResult = await generateTriage(
    intentResult.intent,
    extractionResult.entities,
    query,
    conversationHistory
  );
  const replyResult = await generateReply(
    triageResult.triage,
    intentResult.intent,
    extractionResult.entities
  );

  return {
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    reasoning: intentResult.reasoning,
    entities: extractionResult.entities,
    triage: triageResult.triage,
    reply: replyResult.reply,
  };
}
