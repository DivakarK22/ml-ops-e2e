from pathlib import Path
import os

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = Path(os.getenv("MODEL_ARTIFACT_DIR", REPO_ROOT / "artifacts"))
ARTIFACTS.mkdir(parents=True, exist_ok=True)

load_dotenv(REPO_ROOT / ".env")


def mlflow_uri() -> str:
    return os.getenv("MLFLOW_TRACKING_URI", "http://127.0.0.1:5000")


def langfuse_config() -> dict[str, str | None]:
    return {
        "public_key": os.getenv("LANGFUSE_PUBLIC_KEY"),
        "secret_key": os.getenv("LANGFUSE_SECRET_KEY"),
        "host": os.getenv("LANGFUSE_HOST", "http://127.0.0.1:3001"),
    }


def ollama_base() -> str:
    return os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")


def ollama_model() -> str:
    return os.getenv("OLLAMA_MODEL", "llama3.2:1b")