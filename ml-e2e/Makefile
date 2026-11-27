.PHONY: install notebook stages compose compose-ollama train serve test

install:
	pip install -e ".[dev]"

notebook:
	cd notebooks && jupyter lab --ip=0.0.0.0 --no-browser

stages:
	python -m ml_e2e.run_pipeline --all

compose:
	docker compose up -d mlflow chroma langfuse-web langfuse-worker postgres prometheus grafana

compose-ollama:
	docker compose --profile ollama up -d

train:
	python -m ml_e2e.stages.stage02_sklearn
	python -m ml_e2e.stages.stage08_mlflow

serve:
	uvicorn ml_e2e.service.app:app --host 0.0.0.0 --port 8080 --reload

test:
	pytest -q