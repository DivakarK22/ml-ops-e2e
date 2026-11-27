# OpenRouter Chat UI

ChatGPT-style web UI powered by [OpenRouter](https://openrouter.ai), with **Chat** (single-model streaming) and **Agent** (plan → worker steps → synthesis) modes.

## Quick start

```bash
cd chat-app
cp .env.example .env.local
# Edit .env.local and set OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Model picker loaded from OpenRouter’s model list
- Streaming responses in Chat mode
- Agent orchestration: planner model, worker model, visible step timeline
- Conversation history in `localStorage` (browser only)
- API key stays on the server (`OPENROUTER_API_KEY`)

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm start`    | Run production     |