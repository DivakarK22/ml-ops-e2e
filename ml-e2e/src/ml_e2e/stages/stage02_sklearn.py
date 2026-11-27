"""Stage 2: scikit-learn — classification + persisted model for serving."""

from __future__ import annotations

import json
import pickle

from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from ml_e2e.config import ARTIFACTS


def main() -> None:
    X, y = load_iris(return_X_y=True, as_frame=True)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    report = classification_report(y_test, preds, output_dict=True)

    model_path = ARTIFACTS / "iris_rf.pkl"
    with model_path.open("wb") as f:
        pickle.dump({"model": clf, "feature_names": list(X.columns)}, f)

    metrics_path = ARTIFACTS / "stage02_metrics.json"
    metrics_path.write_text(json.dumps({"accuracy": acc, "report": report}, indent=2))
    print(f"Stage 2 — accuracy={acc:.3f}, saved {model_path}")


if __name__ == "__main__":
    main()