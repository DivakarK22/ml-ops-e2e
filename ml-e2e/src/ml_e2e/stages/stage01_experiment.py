"""Stage 1: experimentation — numpy/pandas vectors and summary stats."""

from __future__ import annotations

import json

import numpy as np
import pandas as pd

from ml_e2e.config import ARTIFACTS


def main() -> None:
    rng = np.random.default_rng(42)
    n = 200
    df = pd.DataFrame(
        {
            "feature_a": rng.normal(0, 1, n),
            "feature_b": rng.normal(2, 0.5, n),
            "label": rng.integers(0, 2, n),
        }
    )
    df["vector_norm"] = np.linalg.norm(df[["feature_a", "feature_b"]].values, axis=1)

    summary = {
        "rows": len(df),
        "label_balance": df["label"].value_counts().to_dict(),
        "mean_norm": float(df["vector_norm"].mean()),
    }
    out = ARTIFACTS / "stage01_summary.json"
    out.write_text(json.dumps(summary, indent=2))
    print("Stage 1 complete:", summary)
    print("Wrote", out)


if __name__ == "__main__":
    main()