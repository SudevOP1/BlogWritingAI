import inspect

orchestrator_prompt = """You are generating a structured blog plan.
Return ONLY valid JSON. Do not include markdown or explanations.

The JSON must follow this exact schema:
- blog_title: string
- tasks: list of objects with:
  - id: integer (start from 1, increment by 1)
  - title: string
  - brief: string (1-2 lines describing what to cover)

Constraints:
- Create 5 to 7 tasks
- Titles must be concise
- Briefs must be specific and informative
- Ensure logical flow from introduction to conclusion

Topic: {topic}"""

worker_prompt = """Give section contents for a blog in Markdown format.
Only return the section in Markdown.
Topic: {topic}
Blog title: {blog_title}
Section title: {title}
Brief: {brief}"""


def _get_formatted_prompt(prompt: str, **kwargs):
    for key, value in kwargs.items():
        prompt = prompt.replace(f"{{{key}}}", value)
    return prompt


def _get_params(prompt: str) -> list[str]:
    params = []

    # find {{param}} in prompt
    for word in prompt.split():
        if word.startswith("{{") and word.endswith("}}"):
            params.append(word[2:-2])

    return params


def _create_get_prompt_functions(prompts: list[str]):
    """create get_prompt function for each prompt dynamically

    Note: Function names are derived from the variable names in the global scope.
    For example, the variable 'orchestrator_prompt' will generate 'get_orchestrator_prompt'.
    """
    global_vars = globals()

    for prompt in prompts:
        prompt_name = None
        for var_name, var_value in global_vars.items():
            if var_value is prompt and var_name.endswith("_prompt"):
                prompt_name = var_name[:-7]  # strip '_prompt'
                break

        if not prompt_name:
            prompt_name = "prompt"

        params = _get_params(prompt)
        func_name = f"get_{prompt_name}_prompt"

        def make_getter(p: str, param_names: list[str], name: str):
            def getter(**kwargs):
                return _get_formatted_prompt(p, **kwargs)

            getter.__name__ = name
            getter.__signature__ = inspect.Signature(
                [
                    inspect.Parameter(name, inspect.Parameter.KEYWORD_ONLY, default="")
                    for name in param_names
                ]
            )
            return getter

        globals()[func_name] = make_getter(prompt, params, func_name)


_create_get_prompt_functions(
    [
        orchestrator_prompt,
        worker_prompt,
    ]
)
