"""Stage 6: LangGraph — tools and multi-step workflow."""

from __future__ import annotations

import json
import math
import re
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, StateGraph

from ml_e2e.config import ARTIFACTS


def safe_eval(expression: str) -> str:
    allowed = {"sqrt": math.sqrt}
    try:
        return str(eval(expression, {"__builtins__": {}}, allowed))  # noqa: S307 curriculum demo
    except Exception as e:
        return f"error: {e}"


class AgentState(TypedDict):
    messages: Annotated[list, "messages"]


def extract_node(state: AgentState) -> dict:
    text = state["messages"][-1].content if state["messages"] else ""
    lowered = text.lower()
    if "sqrt" in lowered:
        start = lowered.index("sqrt")
        expr = text[start:].split("?")[0].strip()
    else:
        m = re.search(r"[\d.+\-*/()]+", text)
        expr = m.group(0) if m else "2+2"
    return {"messages": state["messages"] + [AIMessage(content=f"EXPR:{expr}")]}


def compute_node(state: AgentState) -> dict:
    last = state["messages"][-1].content
    expr = last.replace("EXPR:", "").strip()
    result = safe_eval(expr)
    return {"messages": state["messages"] + [AIMessage(content=f"Result: {result}")]}


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("extract", extract_node)
    graph.add_node("compute", compute_node)
    graph.set_entry_point("extract")
    graph.add_edge("extract", "compute")
    graph.add_edge("compute", END)
    return graph.compile()


def main() -> None:
    app = build_graph()
    out = app.invoke({"messages": [HumanMessage(content="What is sqrt(81)+4?")]})
    texts = [getattr(m, "content", str(m)) for m in out["messages"]]
    payload = {"messages": texts, "pattern": "extract → compute (LangGraph workflow)"}
    (ARTIFACTS / "stage06_langgraph.json").write_text(json.dumps(payload, indent=2))
    print("Stage 6 —", texts[-1])


if __name__ == "__main__":
    main()