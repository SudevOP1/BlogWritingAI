from langchain_tavily import TavilySearch
import json

from utils import debug


def invoke_internet_search(query: str, max_results: int = 5) -> list[dict]:

    debug.log("tavily_query  ", query)

    tool = TavilySearch(max_results=max_results)
    results = tool.invoke({"query": query})

    # TavilySearch can return a list of dicts or a list of strings
    if isinstance(results, dict):
        results = results.get("results", [])

    normalized: list[dict] = []
    for r in results:
        if isinstance(r, str):
            normalized.append(
                {
                    "title": None,
                    "url": None,
                    "snippet": r,
                    "published_at": None,
                    "source": None,
                }
            )
        elif isinstance(r, dict):
            normalized.append(
                {
                    "title": r.get("title"),
                    "url": r.get("url"),
                    "snippet": r.get("content") or r.get("snippet"),
                    "published_at": r.get("published_date") or r.get("published_at"),
                    "source": r.get("source"),
                }
            )

    results_str = json.dumps(normalized)
    debug.log("tavily_results", results_str)

    return normalized
