DEBUG = True

yellow = "\033[93m"
red = "\033[31m"
clear = "\033[0m"


def log(name: str, msg: str) -> None:
    if DEBUG:
        print(f"[{yellow}{name}{clear}] {msg}")


def error(name: str, error: str) -> None:
    if DEBUG:
        print(f"[{red}{name}{clear}] {error}")
