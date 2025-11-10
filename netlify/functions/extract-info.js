'use strict';

const { createOpenAIClient, handleError, parseBody, successResponse } = require('./_helpers');

const SYSTEM_PROMPT = `You are the information extraction module of a Web3 support triage system.

Your job is to extract structured entities from user queries related to Web3 support.

Extract these fields if present:
- transactionHash: Blockchain transaction identifier (0x... hex or NEAR tx hash)
- walletAddress: Wallet or account address
- network: Blockchain network mentioned (NEAR, Aurora, BSC, Ethereum, Polygon, etc.)
- token: Token symbol (USDC, NEAR, ETH, USDT, etc.)
- platform: Platform or exchange (Binance, MetaMask, Rainbow, OKX, etc.)

Rules:
- Return ONLY valid JSON with this exact structure: { "entities": { "transactionHash": null, "walletAddress": null, "network": null, "token": null, "platform": null } }
- Set fields to null if not found in the query
- Be precise — don't guess or infer values that aren't clearly stated
- Consider conversation history — information may have been provided in earlier messages
- Transaction hashes are typically 0x followed by 64 hex chars, or NEAR-style hashes
- Network names should be normalized (e.g., "Binance Smart Chain" → "BSC", "Ether" → "Ethereum")`;

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
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Ensure all fields exist even if AI didn't return them
    const defaultEntities = {
      transactionHash: null,
      walletAddress: null,
      network: null,
      token: null,
      platform: null,
    };

    result.entities = { ...defaultEntities, ...(result.entities || {}) };

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};
