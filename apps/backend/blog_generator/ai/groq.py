from openai import OpenAI
import re
import time

from utils import debug
from . import client


def _parse_retry_after(error_str: str) -> int | None:
    """
    Try to extract a retry-after time (in seconds) from a Groq rate limit error message.
    Groq errors typically say "Please try again in Xs" or "try again in X.XXs".
    Returns seconds as an int, or None if not found.
    """
    match = re.search(r"try again in (\d+(?:\.\d+)?)\s*s", error_str, re.IGNORECASE)
    if match:
        return int(float(match.group(1))) + 1  # round up for safety
    return None


def invoke_ai(prompt: str, model: str = client.GROQ_AI_MODEL) -> tuple[bool, str]:
    """
    invoke the groq api
    returns success_bool and response_str or error_str
    """

    debug.log(name="prompt  ", msg=prompt)

    try:
        response = (
            OpenAI(
                api_key=client.GROQ_BLOGAI_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            .responses.create(
                input=prompt,
                model=model,
            )
            .output_text
        )

        if not response:
            raise ValueError(f"Invalid response: {response}")

        debug.log(name="response", msg=response)

        return True, response

    except ValueError as e:
        debug.error(name="Invalid resp", error=f"Invalid resp:\n{str(e)}")
        return False, str(e)

    except Exception as e:
        debug.error(name="Error", error=str(e))
        return False, str(e)


def invoke_ai_with_retries(
    prompt: str,
    model: str = client.GROQ_AI_MODEL,
    max_retries: int = 6,
    base_delay: int = 6,
) -> tuple[bool, str]:
    """
    invoke the groq api with retry logic for rate limits
    returns success_bool and response_str or error_str

    On exhausted rate-limit retries, returns: (False, "RATE_LIMITED:<seconds>")
    so the caller can surface a user-friendly retry-after message.
    """

    last_error = ""

    # # ai rate limit testing
    # return False, f"RATE_LIMITED:1000"

    try:
        for attempt in range(max_retries):
            response_ok, response = invoke_ai(
                prompt=prompt,
                model=model,
            )

            if response_ok:
                return True, response

            if (
                "Too many requests" in response
                or "rate_limit_exceeded" in response.lower()
            ):
                last_error = response
                if attempt < max_retries - 1:
                    delay = base_delay * (2**attempt)
                    debug.error(
                        name="Rate limited",
                        error=f"Waiting {delay}s... (attempt {attempt + 1}/{max_retries})",
                    )
                    time.sleep(delay)
                else:
                    # All retries exhausted — build a structured rate-limit error
                    retry_after = _parse_retry_after(response) or 60
                    return False, f"RATE_LIMITED:{retry_after}"
            elif "Invalid response" in response:
                last_error = response
                if attempt < max_retries - 1:
                    delay = base_delay * (2**attempt)
                    debug.error(
                        name="Invalid response",
                        error=f"Response:\n{response}\n\nRetrying in {delay}s... (attempt {attempt + 1}/{max_retries})",
                    )
                    time.sleep(delay)
                else:
                    return False, response
            else:
                return False, response

    except Exception as e:
        return False, str(e)
