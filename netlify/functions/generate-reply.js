'use strict';

const { createOpenAIClient, handleError, parseBody, successResponse } = require('./_helpers');

const SYSTEM_PROMPT = `You are the response generation module of a Web3 support triage system.

Your job is to take a triage analysis and generate a natural, human-like response that a moderator would send to the user.

Guidelines:
- Return ONLY valid JSON: { "reply": "your response here" }
- Write in a natural, slightly informal tone — like a real community moderator, not a corporate support bot
- Keep it short (1-3 sentences)
- Be helpful but not overly formal
- Use contractions (I'm, can't, let's)
- Don't use robotic phrases like "I understand your concern" or "Thank you for reaching out"
- If asking for information, be specific about what you need
- If there's a scam risk, be direct and urgent without being alarmist
- Match the energy of a real Discord/Telegram support channel`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { triage, intent, entities } = parseBody(event);

    if (!triage) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Triage data is required', code: 'MISSING_TRIAGE' }),
      };
    }

    const openai = await createOpenAIClient();

    const contextMessage = `Triage analysis:
- Issue type: ${triage.issueType || 'Unknown'}
- Confidence: ${triage.confidence || 'Low'}
- User situation: ${triage.userSituation || 'Not specified'}
- Likely cause: ${triage.likelyCause || 'Unknown'}
- Missing info: ${JSON.stringify(triage.missingInfo || [])}
- Suggested draft reply: ${triage.suggestedReply || 'N/A'}

Intent: ${intent || 'Unknown'}
Entities: ${JSON.stringify(entities || {})}

Generate a natural, human-like moderator response based on this triage analysis.`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contextMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return successResponse({ reply: result.reply || triage.suggestedReply || '' });
  } catch (error) {
    return handleError(error);
  }
};
