from langgraph.graph import StateGraph, START, END

from .models import State
from .nodes import router_node, research_node, orchestrator_node, worker_node, reducer_node, route_next


def build_app():
    g = StateGraph(State)
    g.add_node("router", router_node)
    g.add_node("research", research_node)
    g.add_node("orchestrator", orchestrator_node)
    g.add_node("worker", worker_node)
    g.add_node("reducer", reducer_node)

    g.add_edge(START, "router")
    g.add_conditional_edges(
        "router",
        route_next,
        {"research": "research", "orchestrator": "orchestrator"},
    )
    g.add_edge("research", "orchestrator")
    g.add_edge("orchestrator", "worker")
    g.add_edge("worker", "reducer")
    g.add_edge("reducer", END)

    app = g.compile()
    return app


if __name__ == "__main__":
    app = build_app()

    print("\nPaste this code at https://mermaid.live/edit/ to view the graph:\n")
    print(app.get_graph().draw_mermaid())
