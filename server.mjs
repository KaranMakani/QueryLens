// local dev api server - mirrors netlify functions for development
// NOT used in production

import 'dotenv/config';
import { createServer } from 'http';
import OpenAI from 'openai';

const PORT = 3001;

function createOpenAIClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://querylens.app',
      'X-Title': 'QueryLens Web3 Support Triage',
    },
  });
}

// --- Intent Detection ---
const INTENT_CATEGORIES = [
  { id: 'missing_funds', label: 'Missing Funds' },
  { id: 'wrong_network', label: 'Wrong Network' },
  { id: 'bridge_delay', label: 'Bridge Delay' },
  { id: 'wallet_confusion', label: 'Wallet Confusion' },
  { id: 'scam_risk', label: 'Scam Risk' },
  { id: 'out_of_scope', label: 'Out of Scope' },
];

const INTENT_PROMPT = `You are the intent detection module of a Web3 support triage system.

Your job is to classify user queries into one of these categories:
${INTENT_CATEGORIES.map((c) => `- ${c.id}: ${c.label}`).join('\n')}

Rules:
- Return ONLY valid JSON with this exact structure: { "intent": "category_id", "confidence": 0.0-1.0, "reasoning": "brief explanation" }
- "confidence" must be a number between 0 and 1
- If the query seems unrelated to Web3 support, classify as "out_of_scope"
- If someone mentions being asked to DM an admin, share private keys, or connect to suspicious links, classify as "scam_risk"
- Be conservative with high confidence — only use >0.85 when the intent is unambiguous
- Consider the conversation history context when classifying follow-up messages`;

// --- Information Extraction ---
const EXTRACT_PROMPT = `You are the information extraction module of a Web3 support triage system.

Your job is to extract structured entities from user queries related to Web3 support.

Extract these fields if present:
- transactionHash: Blockchain transaction identifier (0x... hex format)
- walletAddress: Wallet or account address
- network: Blockchain network mentioned (Ethereum, BSC, Polygon, Arbitrum, Solana, etc.)
- token: Token symbol (USDC, ETH, USDT, BTC, etc.)
- platform: Platform or exchange (Binance, MetaMask, OKX, etc.)

Rules:
- Return ONLY valid JSON with this exact structure: { "entities": { "transactionHash": null, "walletAddress": null, "network": null, "token": null, "platform": null } }
- Set fields to null if not found in the query
- Be precise — don't guess or infer values that aren't clearly stated
- Consider conversation history — information may have been provided in earlier messages
- Transaction hashes are typically 0x followed by 64 hex chars
- Network names should be normalized (e.g., "Binance Smart Chain" → "BSC", "Ether" → "Ethereum")`;

// --- Triage ---
const TRIAGE_PROMPT = `You are the triage analysis module of a Web3 support triage system.

Your job is to generate a structured triage analysis based on the classified intent and extracted information.

You must return a JSON object with this exact structure:
{
  "issueType": "Human-readable issue type name",
  "confidence": "High|Medium|Low",
  "userSituation": "Brief description of the user's situation in plain language",
  "likelyCause": "Most probable cause of the issue",
  "missingInfo": ["field1", "field2"],
  "modAction": "What the moderator should do next",
  "suggestedReply": "A draft reply for the moderator to send to the user"
}

Guidelines:
- Confidence should be "High" only when the cause is nearly certain, "Medium" for likely causes, "Low" when uncertain
- likelyCause should reference known patterns:
  * Wrong network withdrawals from exchanges (e.g. sending via BSC when the wallet expects an L2)
  * Tokens not visible due to missing token import in wallet
  * Bridge delays mistaken for failed transactions (cross-chain bridges can take 30min+)
  * Funds sent to wrong address
  * Scam attempts via DM or fake admin contacts
- When the user mentions a bridge or network issue but doesn't specify details, ask which bridge they used, which networks (from/to), and the transaction hash
- suggestedReply should be natural and slightly informal (2-3 sentences max)
- If missingInfo is not empty, the suggestedReply should politely ask for the missing information
- Do NOT assume or hardcode specific bridge names, networks, or protocols — ask the user for specifics`;

// --- Reply Generation ---
const REPLY_PROMPT = `You are the response generation module of a Web3 support triage system.

Your job is to take a triage analysis and generate a natural, human-like response.

Guidelines:
- Return ONLY valid JSON: { "reply": "your response here" }
- Write in a natural, slightly informal tone — like a real community moderator
- Keep it short (1-3 sentences)
- Use contractions (I'm, can't, let's)
- Don't use robotic phrases like "I understand your concern"
- If there's a scam risk, be direct and urgent without being alarmist`;

// --- Route handlers ---
async function handleIntentDetect(body) {
  const openai = await createOpenAIClient();
  const { query, conversationHistory = [] } = body;

  const messages = [
    { role: 'system', content: INTENT_PROMPT },
    ...conversationHistory.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
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
  const validIntents = INTENT_CATEGORIES.map((c) => c.id);
  if (!validIntents.includes(result.intent)) {
    result.intent = 'out_of_scope';
    result.confidence = Math.min(result.confidence, 0.5);
  }
  result.confidence = Math.max(0, Math.min(1, result.confidence || 0));
  return result;
}

async function handleExtractInfo(body) {
  const openai = await createOpenAIClient();
  const { query, conversationHistory = [] } = body;

  const messages = [
    { role: 'system', content: EXTRACT_PROMPT },
    ...conversationHistory.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
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
  const defaultEntities = { transactionHash: null, walletAddress: null, network: null, token: null, platform: null };
  result.entities = { ...defaultEntities, ...(result.entities || {}) };
  return result;
}

async function handleTriage(body) {
  const openai = await createOpenAIClient();
  const { intent, entities, query, conversationHistory = [] } = body;

  const contextMessage = `Classified intent: ${intent}\nExtracted entities: ${JSON.stringify(entities, null, 2)}\nUser query: "${query}"\n${conversationHistory.length > 0 ? `Previous conversation: ${conversationHistory.map((m) => `${m.role}: ${m.content}`).join(' | ')}` : ''}`;

  const messages = [
    { role: 'system', content: TRIAGE_PROMPT },
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
  const defaultTriage = { issueType: intent, confidence: 'Low', userSituation: '', likelyCause: '', missingInfo: [], modAction: '', suggestedReply: '' };
  const triage = { ...defaultTriage, ...result };
  triage.missingInfo = Array.isArray(triage.missingInfo) ? triage.missingInfo : [];
  return { triage };
}

async function handleGenerateReply(body) {
  const openai = await createOpenAIClient();
  const { triage, intent, entities } = body;

  const contextMessage = `Triage analysis:\n- Issue type: ${triage.issueType || 'Unknown'}\n- Confidence: ${triage.confidence || 'Low'}\n- User situation: ${triage.userSituation || 'Not specified'}\n- Likely cause: ${triage.likelyCause || 'Unknown'}\n- Missing info: ${JSON.stringify(triage.missingInfo || [])}\n- Suggested draft reply: ${triage.suggestedReply || 'N/A'}\n\nIntent: ${intent || 'Unknown'}\nEntities: ${JSON.stringify(entities || {})}\n\nGenerate a natural, human-like moderator response.`;

  const messages = [
    { role: 'system', content: REPLY_PROMPT },
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
  return { reply: result.reply || triage.suggestedReply || '' };
}

// --- Server ---
const routes = {
  'intent-detect': handleIntentDetect,
  'extract-info': handleExtractInfo,
  'triage': handleTriage,
  'generate-reply': handleGenerateReply,
};

const server = createServer(async (req, res) => {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Extract route name from URL: /api/intent-detect → intent-detect
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const match = url.pathname.match(/^\/api\/(.+)$/);

  if (!match || !routes[match[1]]) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // Parse body
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    body = JSON.parse(body || '{}');
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  // Handle the route
  try {
    const result = await routes[match[1]](body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error('[QueryLens API Error]', error);
    const status = error.status || 500;
    const message = error.status === 429
      ? 'Rate limit reached. Please wait a moment and try again.'
      : error.status === 401
        ? 'API key is invalid or missing. Check your configuration.'
        : 'Something went wrong processing your request. Please try again.';
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n  ⚡ QueryLens API server running at http://localhost:${PORT}\n`);
  console.log(`  Endpoints:`);
  Object.keys(routes).forEach((r) => console.log(`    POST /api/${r}`));
  console.log();
});
