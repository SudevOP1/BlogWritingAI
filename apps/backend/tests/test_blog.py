from ..blog_generator.graph.blog_graph import build_app

if __name__ == "__main__":
    app = build_app()

    output = app.invoke(
        {
            "topic": "Claude Mythos Preview",
            "save_to_path": "outputs/claude_mythos.md",
        }
    )
