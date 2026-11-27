"""Fast tests without heavy HF downloads."""

import json

from ml_e2e.config import ARTIFACTS
from ml_e2e.stages import stage01_experiment, stage02_sklearn, stage06_langgraph


def test_stage01_writes_summary():
    stage01_experiment.main()
    path = ARTIFACTS / "stage01_summary.json"
    assert path.exists()
    data = json.loads(path.read_text())
    assert data["rows"] == 200


def test_stage02_trains_iris_model():
    stage02_sklearn.main()
    assert (ARTIFACTS / "iris_rf.pkl").exists()


def test_stage06_langgraph_result():
    stage06_langgraph.main()
    payload = json.loads((ARTIFACTS / "stage06_langgraph.json").read_text())
    assert any("13.0" in m for m in payload["messages"])