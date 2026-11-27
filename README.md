# ml-ops-e2e

End-to-end machine learning and AI projects in one repo.

## Projects

| Path | Description |
|------|-------------|
| **[`ml-e2e/`](./ml-e2e/)** | **10-stage OSS curriculum** — Jupyter, scikit-learn, PyTorch, Hugging Face, Ollama + Chroma RAG, LangGraph, **Langfuse** (replaces paid LangSmith), MLflow, FastAPI + Docker, K8s + Prometheus + Grafana |
| **[`chat-app/`](./chat-app/)** | ChatGPT-style UI on OpenRouter (chat + agent orchestration) |

## ml-e2e quick start

```bash
cd ml-e2e
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m ml_e2e.run_pipeline --all
docker compose up -d
```

Details: [ml-e2e/README.md](./ml-e2e/README.md) and [ml-e2e/STACK.md](./ml-e2e/STACK.md).

## chat-app quick start

```bash
cd chat-app
cp .env.example .env.local   # OPENROUTER_API_KEY
npm install && npm run dev
```