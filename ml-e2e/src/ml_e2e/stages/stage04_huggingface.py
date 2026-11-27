"""Stage 4: Hugging Face — small sentiment pipeline + save tokenizer refs."""

from __future__ import annotations

import json

from transformers import pipeline

from ml_e2e.config import ARTIFACTS

MODEL_ID = "distilbert-base-uncased-finetuned-sst-2-english"


def main() -> None:
    clf = pipeline("sentiment-analysis", model=MODEL_ID, truncation=True)
    samples = [
        "This curriculum makes MLOps approachable.",
        "I am worried the model will overfit.",
    ]
    results = clf(samples)

    out = ARTIFACTS / "stage04_hf_sentiment.json"
    payload = {"model_id": MODEL_ID, "samples": samples, "results": results}
    out.write_text(json.dumps(payload, indent=2))
    (ARTIFACTS / "hf_model_id.txt").write_text(MODEL_ID)
    print("Stage 4 —", results)


if __name__ == "__main__":
    main()