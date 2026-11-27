"""Stage 5: embeddings + Chroma vector store (+ optional Ollama generation)."""

from __future__ import annotations

import json

import httpx
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings

from ml_e2e.config import ARTIFACTS, ollama_base, ollama_model

DOCS = [
    ("mlflow", "MLflow tracks parameters, metrics, and model versions."),
    ("langfuse", "Langfuse is an open-source alternative to LangSmith for LLM traces."),
    ("chromadb", "Chroma stores embedding vectors for similarity search in RAG."),
    ("fastapi", "FastAPI serves models as HTTP APIs with automatic OpenAPI docs."),
]


def maybe_ollama_answer(question: str, context: str) -> str | None:
    try:
        r = httpx.post(
            f"{ollama_base()}/api/generate",
            json={
                "model": ollama_model(),
                "prompt": f"Context:\n{context}\n\nQuestion: {question}\nAnswer briefly:",
                "stream": False,
            },
            timeout=60.0,
        )
        if r.status_code == 200:
            return r.json().get("response")
    except httpx.HTTPError:
        pass
    return None


def main() -> None:
    persist = str(ARTIFACTS / "chroma_db")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    docs = [Document(page_content=text, metadata={"topic": topic}) for topic, text in DOCS]
    store = Chroma.from_documents(docs, embeddings, persist_directory=persist)

    question = "What open source tool replaces LangSmith?"
    hits = store.similarity_search(question, k=2)
    context = "\n".join(d.page_content for d in hits)

    answer = maybe_ollama_answer(question, context)
    if not answer:
        answer = f"[retrieval-only] Top chunk: {hits[0].page_content}"

    payload = {
        "question": question,
        "retrieved": [d.metadata for d in hits],
        "answer": answer,
        "persist_dir": persist,
    }
    (ARTIFACTS / "stage05_rag.json").write_text(json.dumps(payload, indent=2))
    print("Stage 5 —", payload["answer"])


if __name__ == "__main__":
    main()