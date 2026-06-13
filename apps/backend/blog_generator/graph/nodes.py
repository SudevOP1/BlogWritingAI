from pathlib import Path
import json

from ..research.tavily import invoke_internet_search

# from ..ai.ollama_ai import invoke_ai_with_retries
from ..ai.groq import invoke_ai_with_retries
from utils import debug
from .models import State, Plan, RouterDecision, EvidencePack
from . import prompts


def router_node(state: State, config=None) -> dict:

    prompt = prompts.get_router_prompt(topic=state.topic)
    content_ok, content = invoke_ai_with_retries(prompt=prompt)

    if not content_ok:
        raise ValueError(f"Router Error: {content}")

    content = content.strip().strip("```json").strip("```")

    if '"error":' in content:
        raise ValueError(f"Router Error: {content}")

    # parse the json response into a RouterDecision object
    router_decision_dict = json.loads(content)
    router_decision = RouterDecision(**router_decision_dict)

    return {
        "needs_research": router_decision.needs_research,
        "mode": router_decision.mode,
        "queries": router_decision.queries,
    }


def route_next(state: State, config=None) -> str:
    return "research" if state.needs_research else "orchestrator"


def research_node(state: State, config=None) -> dict:

    # take only first 10 queries from state.queries
    queries = state.queries[:10] if state.queries is not None else []
    max_results = 6

    raw_results: list[dict] = []
    for query in queries:
        raw_results.extend(invoke_internet_search(query=query, max_results=max_results))

    if not raw_results:
        return {"evidence": []}

    response_ok, response = invoke_ai_with_retries(
        prompt=prompts.get_research_prompt(
            raw_results=json.dumps(raw_results, indent=2)
        )
    )

    if not response_ok:
        return {"evidence": []}

    # parse the json response into an EvidencePack object
    response = response.strip().strip("```json").strip("```")
    evidence_pack_dict = json.loads(response)
    evidence_pack = EvidencePack(**evidence_pack_dict)

    # deduplication by url
    deduplicated = {}
    for e in evidence_pack.evidence:
        if e.url not in deduplicated:
            deduplicated[e.url] = e

    return {"evidence": list(deduplicated.values())}


def orchestrator_node(state: State, config=None) -> dict:

    prompt = prompts.get_orchestrator_prompt(
        topic=state.topic,
        mode=state.mode,
        evidence=",\n".join([str(e) for e in state.evidence][:16]) or "None",
    )
    content_ok, content = invoke_ai_with_retries(prompt=prompt)

    if not content_ok:
        raise ValueError(f"Orchestrator Error: {content}")

    # parse the json response into a Plan object
    content = content.strip().strip("```json").strip("```")
    plan_dict = json.loads(content)
    plan = Plan(**plan_dict)

    # set attributes in state for real-time updates in UI
    state.final = f"# {plan.blog_title}\n\n" + "\n\n".join(
        [f"## {task.title}" for task in plan.tasks]
    )
    state.plan = plan

    return {"plan": plan}


def worker_node(state: State, config=None) -> dict:
    sections = []

    topic = state.topic
    plan = state.plan
    blog_title = plan.blog_title
    audience = plan.audience
    tone = plan.tone
    blog_kind = plan.blog_kind
    constraints = plan.constraints
    mode = state.mode
    evidence = ",\n".join([str(e) for e in state.evidence][:16]) or "None"

    for i, task in enumerate(plan.tasks):
        prompt = prompts.get_worker_prompt(
            blog_title=blog_title,
            audience=audience,
            tone=tone,
            blog_kind=blog_kind,
            constraints=constraints,
            topic=topic,
            mode=mode,
            section_title=task.title,
            goal=task.goal,
            target_words=task.target_words,
            tags=task.tags,
            requires_research=task.requires_research,
            requires_citations=task.requires_citations,
            requires_code=task.requires_code,
            bullets=task.bullets,
            evidence=evidence,
        )

        section_ok, section_md = invoke_ai_with_retries(prompt=prompt)

        if not section_ok:
            raise ValueError(f"Worker Error: {section_md.strip()}")

        sections.append(section_md.strip())

    return {"sections": sections}


def reducer_node(state: State) -> dict:

    title = state.plan.blog_title
    body = "\n\n".join(state.sections).strip()
    final_md = f"# {title}\n\n{body}\n"

    if state.save_to_path is not None:
        path = Path(state.save_to_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(final_md, encoding="utf-8")
        debug.log(name="saved", msg=f"Blog saved to {path}")

    return {"final": final_md}
