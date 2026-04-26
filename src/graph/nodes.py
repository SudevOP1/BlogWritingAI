from pathlib import Path
import time
import json

from ..ai.invoke import invoke_ai_with_retries
from ..utils import debug
from .models import State, Plan
from . import prompts


def orchestrator(state: State, config=None) -> dict:

    prompt = prompts.get_orchestrator_prompt(topic=state.topic)
    content_ok, content = invoke_ai_with_retries(prompt=prompt)

    if not content_ok:
        raise ValueError(f"Orchestrator returned invalid response.\nError: {content}")

    content = content.strip().strip("```json").strip("```")

    # parse the json response into a Plan object
    plan_dict = json.loads(content)
    plan = Plan(**plan_dict)

    return {"plan": plan}


def worker(state: State, config=None) -> dict:
    sections = []

    topic = state.topic
    plan = state.plan
    blog_title = plan.blog_title

    for i, task in enumerate(plan.tasks):
        prompt = prompts.get_worker_prompt(
            topic=topic,
            blog_title=blog_title,
            title=task.title,
            brief=task.brief,
        )

        if i < (len(plan.tasks) - 1):
            time.sleep(10)

        section_ok, section_md = invoke_ai_with_retries(prompt=prompt)

        if not section_ok:
            raise ValueError(
                f"Worker returned invalid response.\nError: {section_md.strip()}"
            )

        sections.append(section_md.strip())

    return {"sections": sections}


def reducer(state: State) -> dict:

    title = state.plan.blog_title
    body = "\n\n".join(state.sections).strip()
    final_md = f"# {title}\n\n{body}\n"

    if state.save_to_path is not None:
        path = Path(state.save_to_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(final_md, encoding="utf-8")
        debug.log(name="saved", msg=f"Blog saved to {path}")

    return {"final": final_md}
