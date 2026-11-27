"""Run curriculum stages in order."""

from __future__ import annotations

import argparse
import importlib

STAGES = [
    ("01", "ml_e2e.stages.stage01_experiment", "Experimentation — vectors & datasets"),
    ("02", "ml_e2e.stages.stage02_sklearn", "Scikit-learn classification"),
    ("03", "ml_e2e.stages.stage03_pytorch", "PyTorch training"),
    ("04", "ml_e2e.stages.stage04_huggingface", "Hugging Face transformers"),
    ("05", "ml_e2e.stages.stage05_rag", "Embeddings + Chroma RAG"),
    ("06", "ml_e2e.stages.stage06_langgraph", "LangGraph agent"),
    ("07", "ml_e2e.stages.stage07_langfuse_eval", "Langfuse traces & eval"),
    ("08", "ml_e2e.stages.stage08_mlflow", "MLflow tracking"),
]


def run_stage(module_name: str, label: str) -> None:
    print(f"\n=== Stage {label} ===")
    mod = importlib.import_module(module_name)
    mod.main()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ml-e2e curriculum stages")
    parser.add_argument("--all", action="store_true", help="Run every stage")
    parser.add_argument("--stage", action="append", help="Stage id, e.g. 02")
    args = parser.parse_args()

    selected = {s[0] for s in STAGES} if args.all else set(args.stage or [])
    if not selected:
        parser.print_help()
        return

    for stage_id, module, label in STAGES:
        if stage_id in selected:
            run_stage(module, label)


if __name__ == "__main__":
    main()