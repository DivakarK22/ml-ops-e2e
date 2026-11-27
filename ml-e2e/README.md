# ml-e2e — full-stack AI/ML curriculum (100% runnable OSS)

Learn the path from notebooks → classical ML → deep learning → HF → RAG → agents → **Langfuse eval** (not LangSmith) → MLflow → FastAPI → K8s monitoring.

See [STACK.md](./STACK.md) for the open-source vs paid mapping.

## Quick start

```bash
cd ml-e2e
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # optional: Langfuse keys after Compose

# Run all curriculum scripts (stages 1–8)
python -m ml_e2e.run_pipeline --all

# Stage 9 — API
make serve
# curl -X POST localhost:8080/v1/predict/iris -H 'Content-Type: application/json' \
#   -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'

# Stage 10 — local “production” stack
docker compose up -d
```

| Service | URL | Purpose |
|---------|-----|---------|
| MLflow | http://localhost:5000 | Experiment tracking |
| Chroma | http://localhost:8000 | Vector DB |
| Langfuse | http://localhost:3001 | Traces / eval (OSS LangSmith alt) |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3002 | Dashboards (`admin` / `admin`) |
| Inference API | http://localhost:8080 | FastAPI + `/metrics` |
| Ollama | http://localhost:11434 | Optional: `docker compose --profile ollama up -d` |

## Curriculum

| Stage | Command | Output |
|-------|---------|--------|
| 1 | `python -m ml_e2e.stages.stage01_experiment` | `artifacts/stage01_summary.json` |
| 2 | `python -m ml_e2e.stages.stage02_sklearn` | `artifacts/iris_rf.pkl` |
| 3 | `python -m ml_e2e.stages.stage03_pytorch` | `artifacts/digits_mlp.pt` |
| 4 | `python -m ml_e2e.stages.stage04_huggingface` | sentiment JSON |
| 5 | `python -m ml_e2e.stages.stage05_rag` | Chroma persist + RAG JSON |
| 6 | `python -m ml_e2e.stages.stage06_langgraph` | LangGraph workflow JSON |
| 7 | `python -m ml_e2e.stages.stage07_langfuse_eval` | eval + optional Langfuse trace |
| 8 | `python -m ml_e2e.stages.stage08_mlflow` | run in MLflow + local pickle |
| 9 | `uvicorn ml_e2e.service.app:app --port 8080` | REST + Prometheus |
| 10 | `kubectl apply -f deploy/kubernetes/` | scale & monitor on K8s |

Notebooks: `make notebook` → open `notebooks/01_experimentation.ipynb`.

## Langfuse keys (after Compose)

1. Open http://localhost:3001 and create a project.
2. Copy API keys into `.env` as `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY`.
3. Re-run stage 7 to emit traces.

## Kubernetes

Build and load the image, then apply manifests:

```bash
docker build -t ml-e2e-api:latest .
kubectl apply -f deploy/kubernetes/
```

Prometheus in Compose already scrapes `api:8080`. On K8s, use the pod annotations in `deployment.yaml` with your cluster’s Prometheus stack.