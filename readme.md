# QueryLens — Web3 Support Triage

> **Note:** This is a prototype build using OpenAI API as a stand-in for the actual AI system. The production version runs on our internal models that are trained on historical support data. This demo exists to showcase the triage logic, decision flow, and output format — not the underlying model.

---

## What it does

QueryLens takes messy, incomplete user queries from Web3 community channels and turns them into structured, actionable triage output for moderators.

Instead of a mod having to manually interpret vague messages like "bro i send usdc from binance not come", figure out what info is missing, then draft a response — this tool handles all of that automatically.

---

## How it works

```
User Query
    ↓
Intent Detection (what kind of issue?)
    ↓
Information Extraction (tx hash, wallet, network, etc.)
    ↓
Decision Engine (enough info? or need follow-up?)
    ↓
Triage Analysis OR Follow-up Question
    ↓
Suggested Reply
```

The system operates in two modes:

**Incomplete Query Mode** — if required details are missing (like tx hash or network), it asks targeted follow-up questions instead of guessing.

**Full Triage Mode** — when enough data is available, it returns a complete structured analysis: issue type, confidence level, likely cause, mod action, and a draft reply.

---

## Features

### Intent Detection

Classifies incoming queries into categories:

- Missing Funds
- Wrong Network
- Bridge Delay
- Wallet Confusion
- Scam Risk

New categories can be added via the config file (`src/config/intents.json`) without touching code.

### Information Extraction

Pulls out relevant details from the message:

- Transaction hash
- Wallet address
- Network name
- Token symbol
- Platform (Binance, MetaMask, etc.)

### Smart Decision Engine

Rule-based logic decides whether to ask for more info or generate a full triage. If the user keeps providing incomplete info (3+ follow-up turns), the system forces a triage with whatever it has.

### Confidence Threshold

When the AI isn't confident about the classification (below 70%), it shows the best guess but asks the moderator to confirm before proceeding.

### Scam Escalation

If a user keeps sending off-topic messages, the system flags it as a potential scam after the second occurrence — moderators get a warning to review.

### Dual Output Format

Every triage result is available in both:

- **Text view** — human-readable, designed for quick scanning
- **JSON view** — structured, for integration with other tools

### Human-like Replies

Generated responses are intentionally casual and short — like how a real mod would respond in Discord or Telegram. No corporate support language.

---

## Tech Stack

- React + Vite (frontend)
- Tailwind CSS (styling, dark mode)
- Netlify Functions (serverless API layer)
- OpenAI API (demo only — production uses internal models)

---

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your OpenAI API key
4. Run locally: `npm run dev`
5. For Netlify deployment, set `OPENAI_API_KEY` as an environment variable in your Netlify dashboard

---

## Project Structure

```
├── netlify/
│   └── functions/
│       ├── _helpers.js         # Shared OpenAI client + error handling
│       ├── intent-detect.js    # Stage 1: Intent classification
│       ├── extract-info.js     # Stage 2: Entity extraction
│       ├── triage.js           # Stage 3: Triage analysis
│       └── generate-reply.js   # Stage 4: Reply generation
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── TriageOutput.jsx
│   │   ├── JsonView.jsx
│   │   ├── ConfidenceBanner.jsx
│   │   └── ScamWarning.jsx
│   ├── config/
│   │   └── intents.json        # Extensible intent categories
│   ├── utils/
│   │   ├── api.js              # Multi-stage API orchestration
│   │   ├── decisionEngine.js   # Rule-based mode selector
│   │   ├── storage.js          # LocalStorage conversation state
│   │   └── formatters.js       # Text/JSON output formatting
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── netlify.toml
├── tailwind.config.js
└── package.json
```

---

## Integration Points

QueryLens is designed to plug into existing support infrastructure. In production, it would be wired up to:

- **Telegram bots** — automatic triage of incoming support messages
- **Discord bots** — instant triage in support channels
- **Email support** — pre-triage before human review
- **Dashboard** — aggregated analytics on support issues

This demo shows the core triage engine via a web UI, but the API layer (Netlify Functions) can be called from any integration point.

---

## Configuration

### Adding New Intent Categories

Edit `src/config/intents.json`:

```json
{
  "categories": [
    {
      "id": "new_category",
      "label": "New Category Name",
      "description": "When this type of issue occurs...",
      "requiredFields": ["transactionHash"],
      "optionalFields": ["network"]
    }
  ]
}
```

The system will automatically pick up new categories and route queries through the same pipeline.

### Confidence Threshold

Adjust in `src/config/intents.json` → `settings.confidenceThreshold` (default: 0.7)

### Max Follow-up Turns

Adjust in `src/config/intents.json` → `settings.maxFollowUpTurns` (default: 3)

---

## Example Flows

### Incomplete Query
```
User: "funds not received"
System: "Can you share the transaction hash and which network you used?"
User: "tx is 0xabc123... sent via BSC"
System: [Full triage: Missing Funds, High confidence, suggested reply]
```

### Scam Detection
```
User: "admin told me to dm him"
System: [Triage: Scam Risk, suggested warning reply]
```

### Wrong Network
```
User: "Sent USDC from Binance via BSC to Aurora, tx: 0x123..."
System: [Full triage: Wrong Network, High confidence, recovery steps]
```

---

## Deployment

Built for Netlify:

1. Connect your repo to Netlify
2. Set `OPENAI_API_KEY` in environment variables
3. Deploy — Netlify handles the build and serverless functions automatically

---

## License

MIT
