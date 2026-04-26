from ..graph.blog_graph import build_app

if __name__ == "__main__":
    app = build_app()

    output = app.invoke(
        {
            "topic": "State of Multimodal LLMs in 2026",
            "save_to_path": "outputs/multimodal_llms_2026.md",
        }
    )
