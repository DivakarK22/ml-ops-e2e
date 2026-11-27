"""Stage 8: MLflow — log sklearn model parameters, metrics, and artifact."""

from __future__ import annotations

import json
import pickle
import mlflow
import mlflow.sklearn
from sklearn.datasets import load_iris
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split

from ml_e2e.config import ARTIFACTS, mlflow_uri


def main() -> None:
    mlflow.set_tracking_uri(mlflow_uri())
    mlflow.set_experiment("ml-e2e")

    X, y = load_iris(return_X_y=True)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=1)

    params = {"n_estimators": 50, "learning_rate": 0.1, "max_depth": 3}
    model = GradientBoostingClassifier(**params)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    f1 = f1_score(y_test, preds, average="macro")

    run_logged = False
    try:
        with mlflow.start_run(run_name="stage08-gbc-iris") as run:
            mlflow.log_params(params)
            mlflow.log_metric("f1_macro", f1)
            mlflow.sklearn.log_model(model, "model")
            run_logged = True
            run_id = run.info.run_id
    except Exception as exc:
        run_id = None
        print(f"MLflow server unreachable ({exc}); saving locally only.")

    local_model = ARTIFACTS / "mlflow_iris_gbc.pkl"
    with local_model.open("wb") as f:
        pickle.dump(model, f)

    meta = {"f1_macro": f1, "mlflow_run_id": run_id, "run_logged": run_logged}
    (ARTIFACTS / "stage08_mlflow.json").write_text(json.dumps(meta, indent=2))
    print("Stage 8 —", meta)


if __name__ == "__main__":
    main()