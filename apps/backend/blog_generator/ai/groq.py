from openai import OpenAI
import time

from utils import debug
from . import client


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
    """

    try:
        for attempt in range(max_retries):
            response_ok, response = invoke_ai(
                prompt=prompt,
                model=model,
            )

            if response_ok:
                return True, response

            if "Too many requests" in response:
                if attempt < max_retries - 1:
                    delay = base_delay * (2**attempt)
                    debug.error(
                        name="Rate limited",
                        error=f"Waiting {delay}s... (attempt {attempt + 1}/{max_retries})",
                    )
                    time.sleep(delay)
                else:
                    return False, response
            elif "Invalid response" in response:
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
