# Stack map (open source vs paid)

| Stage | Your tool | License / cost | This repo uses |
|-------|-----------|----------------|----------------|
| 1. Experimentation | Jupyter / Colab | Jupyter: **Apache 2.0**. Colab: **hosted Google** (not required) | **JupyterLab** (`notebooks/`, `make notebook`) |
| 2. Traditional ML | Scikit-learn | **BSD** | `ml_e2e/stages/stage02_sklearn.py` |
| 3. Deep learning | PyTorch | **BSD** | `stage03_pytorch.py` |
| 4. Model ecosystem | Hugging Face | **Libraries OSS** (hub has free + paid tiers) | `transformers` + small public checkpoints |
| 5. Embeddings & RAG | Ollama + ChromaDB | **Ollama MIT**, **Chroma Apache 2.0** | `stage05_rag.py` + optional Ollama in Compose |
| 6. LLM orchestration | LangChain / LangGraph | **MIT** | `stage06_langgraph.py` |
| 7. Evaluation | LangSmith | **Commercial SaaS** | **[Langfuse](https://langfuse.com)** (MIT, self-host) — drop-in tracing/eval |
| 8. Experiment tracking | MLflow | **Apache 2.0** | MLflow server in `docker-compose.yml` |
| 9. Deployment | FastAPI + Docker | **MIT** / Docker OSS | `service/` + `Dockerfile` |
| 10. Production | K8s + Prometheus + Grafana | **CNCF OSS** | `deploy/kubernetes/`, `deploy/prometheus/`, `deploy/grafana/` |

**Replacements only where needed:** LangSmith → **Langfuse**. Colab is optional; everything runs locally or in Docker.