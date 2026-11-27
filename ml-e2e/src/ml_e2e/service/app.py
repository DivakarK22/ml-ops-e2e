"""Stage 9: FastAPI — serve the sklearn iris model with Prometheus metrics."""

from __future__ import annotations

import pickle
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from pydantic import BaseModel, Field
from starlette.responses import Response

from ml_e2e.config import ARTIFACTS

REQUESTS = Counter("ml_e2e_requests_total", "HTTP inference requests", ["endpoint"])
LATENCY = Histogram("ml_e2e_inference_seconds", "Inference latency")


class IrisFeatures(BaseModel):
    sepal_length: float = Field(..., ge=0)
    sepal_width: float = Field(..., ge=0)
    petal_length: float = Field(..., ge=0)
    petal_width: float = Field(..., ge=0)


class PredictResponse(BaseModel):
    class_index: int
    probabilities: list[float] | None = None


def _load_model() -> Any:
    path = ARTIFACTS / "iris_rf.pkl"
    if not path.exists():
        from ml_e2e.stages import stage02_sklearn

        stage02_sklearn.main()
    with path.open("rb") as f:
        bundle = pickle.load(f)
    return bundle["model"], bundle["feature_names"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model, app.state.feature_names = _load_model()
    yield


app = FastAPI(title="ml-e2e Inference", version="0.1.0", lifespan=lifespan)


@app.get("/healthz")
def healthz():
    REQUESTS.labels(endpoint="healthz").inc()
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/v1/predict/iris", response_model=PredictResponse)
def predict_iris(body: IrisFeatures):
    REQUESTS.labels(endpoint="predict").inc()
    model = app.state.model
    start = time.perf_counter()
    try:
        row = [[body.sepal_length, body.sepal_width, body.petal_length, body.petal_width]]
        pred = int(model.predict(row)[0])
        probs = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(row)[0].tolist()
    finally:
        LATENCY.observe(time.perf_counter() - start)
    return PredictResponse(class_index=pred, probabilities=probs)


def main():
    import uvicorn

    uvicorn.run("ml_e2e.service.app:app", host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()