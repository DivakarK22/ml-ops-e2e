"""Stage 7: Langfuse (OSS) — traces and a tiny eval set (replaces LangSmith)."""

from __future__ import annotations

import json

from ml_e2e.config import ARTIFACTS, langfuse_config
from ml_e2e.stages.stage06_langgraph import safe_eval

EVAL_SET = [
    {"input": "sqrt(9)", "expected_contains": "3"},
    {"input": "2+2", "expected_contains": "4"},
]


def local_eval() -> list[dict]:
    rows = []
    for row in EVAL_SET:
        out = safe_eval(row["input"])
        ok = row["expected_contains"] in out
        rows.append({**row, "output": out, "pass": ok})
    return rows


def main() -> None:
    results = local_eval()
    cfg = langfuse_config()

    trace_meta = {"scores": [r["pass"] for r in results], "backend": "local"}
    if cfg["public_key"] and cfg["secret_key"]:
        try:
            from langfuse import Langfuse

            lf = Langfuse(
                public_key=cfg["public_key"],
                secret_key=cfg["secret_key"],
                host=cfg["host"],
            )
            trace = lf.trace(name="ml-e2e-eval")
            for row in results:
                span = trace.span(name=f"eval-{row['input']}")
                span.event(name="result", metadata=row)
                span.score(name="pass", value=1.0 if row["pass"] else 0.0)
            trace.update(output={"passed": sum(r["pass"] for r in results), "total": len(results)})
            lf.flush()
            trace_meta["backend"] = "langfuse"
            trace_meta["trace_id"] = trace.id
        except Exception as exc:
            trace_meta["langfuse_error"] = str(exc)
    else:
        trace_meta["hint"] = "Set LANGFUSE_* in .env after docker compose up"

    payload = {"eval": results, "tracing": trace_meta}
    (ARTIFACTS / "stage07_eval.json").write_text(json.dumps(payload, indent=2))
    passed = sum(1 for r in results if r["pass"])
    print(f"Stage 7 — eval {passed}/{len(results)}, tracing: {trace_meta['backend']}")


if __name__ == "__main__":
    main()