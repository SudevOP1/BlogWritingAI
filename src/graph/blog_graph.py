from langgraph.graph import StateGraph, START, END

from .models import State
from .nodes import orchestrator, worker, reducer


def build_app():
    g = StateGraph(State)
    g.add_node("orchestrator", orchestrator)
    g.add_node("worker", worker)
    g.add_node("reducer", reducer)

    g.add_edge(START, "orchestrator")
    g.add_edge("orchestrator", "worker")
    g.add_edge("worker", "reducer")
    g.add_edge("reducer", END)

    app = g.compile()
    return app
