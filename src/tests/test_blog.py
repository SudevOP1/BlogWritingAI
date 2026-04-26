from ..graph.blog_graph import build_app

if __name__ == "__main__":
    app = build_app()

    output = app.invoke(
        {
            "topic": "Self Attention",
            "save_to_path": "outputs/self_attention.md",
        }
    )
