'use strict';

const { createOpenAIClient, handleError, parseBody, successResponse } = require('./_helpers');

const SYSTEM_PROMPT = `You are the triage analysis module of a Web3 support triage system for NEAR Protocol and Aurora ecosystem.

Your job is to generate a structured triage analysis based on the classified intent and extracted information.

You must return a JSON object with this exact structure:
{
  "issueType": "Human-readable issue type name",
  "confidence": "High|Medium|Low",
  "userSituation": "Brief description of the user's situation in plain language",
  "likelyCause": "Most probable cause of the issue",
  "missingInfo": ["field1", "field2"] (list of still-missing fields, empty array if none),
  "modAction": "What the moderator should do next",
  "suggestedReply": "A draft reply for the moderator to send to the user"
}

Guidelines:
- Confidence should be "High" only when the cause is nearly certain, "Medium" for likely causes, "Low" when uncertain
- userSituation should be a concise summary anyone can understand
- likelyCause should reference known patterns:
  * Wrong network withdrawals from exchanges (common with Aurora/BSC mismatches)
  * Tokens not visible due to missing token import in wallet
  * Bridge delays mistaken for failed transactions (Rainbow Bridge can take 30min+)
  * Funds sent to wrong address
  * Scam attempts via DM or fake admin contacts
- modAction should be actionable and specific
- suggestedReply should be written in a natural, slightly informal tone — like a real moderator, not a robot
- Keep suggestedReply concise (2-3 sentences max)
- If missingInfo is not empty, the suggestedReply should politely ask for the missing information`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { intent, entities, query, conversationHistory = [] } = parseBody(event);

    if (!intent) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Intent is required', code: 'MISSING_INTENT' }),
      };
    }

    const openai = await createOpenAIClient();

    const contextMessage = `Classified intent: ${intent}
Extracted entities: ${JSON.stringify(entities, null, 2)}
User query: "${query}"
${conversationHistory.length > 0 ? `Previous conversation: ${conversationHistory.map((m) => `${m.role}: ${m.content}`).join(' | ')}` : ''}`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contextMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Ensure required fields exist
    const defaultTriage = {
      issueType: intent,
      confidence: 'Low',
      userSituation: '',
      likelyCause: '',
      missingInfo: [],
      modAction: '',
      suggestedReply: '',
    };

    const triage = { ...defaultTriage, ...result };
    triage.missingInfo = Array.isArray(triage.missingInfo) ? triage.missingInfo : [];

    return successResponse({ triage });
  } catch (error) {
    return handleError(error);
  }
};
