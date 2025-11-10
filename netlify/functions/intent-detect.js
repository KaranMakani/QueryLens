'use strict';

const { createOpenAIClient, handleError, parseBody, successResponse } = require('./_helpers');

const INTENT_CATEGORIES = [
  { id: 'missing_funds', label: 'Missing Funds' },
  { id: 'wrong_network', label: 'Wrong Network' },
  { id: 'bridge_delay', label: 'Bridge Delay' },
  { id: 'wallet_confusion', label: 'Wallet Confusion' },
  { id: 'scam_risk', label: 'Scam Risk' },
  { id: 'out_of_scope', label: 'Out of Scope' },
];

const SYSTEM_PROMPT = `You are the intent detection module of a Web3 support triage system.

Your job is to classify user queries into one of these categories:
${INTENT_CATEGORIES.map((c) => `- ${c.id}: ${c.label}`).join('\n')}

Rules:
- Return ONLY valid JSON with this exact structure: { "intent": "category_id", "confidence": 0.0-1.0, "reasoning": "brief explanation" }
- "confidence" must be a number between 0 and 1
- If the query seems unrelated to Web3 support, classify as "out_of_scope"
- If someone mentions being asked to DM an admin, share private keys, or connect to suspicious links, classify as "scam_risk"
- Be conservative with high confidence — only use >0.85 when the intent is unambiguous
- Consider the conversation history context when classifying follow-up messages`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { query, conversationHistory = [] } = parseBody(event);

    if (!query || !query.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Query is required', code: 'MISSING_QUERY' }),
      };
    }

    const openai = await createOpenAIClient();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: query },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Validate the intent is one of our known categories
    const validIntents = INTENT_CATEGORIES.map((c) => c.id);
    if (!validIntents.includes(result.intent)) {
      result.intent = 'out_of_scope';
      result.confidence = Math.min(result.confidence, 0.5);
    }

    // Clamp confidence to 0-1
    result.confidence = Math.max(0, Math.min(1, result.confidence || 0));

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};
