import os
import datetime

DEBUG = True
LOG_FILEPATH = "logs/logs.csv"

yellow = "\033[93m"
red = "\033[31m"
clear = "\033[0m"


def create_log_file_if_not_exists() -> None:
    """create log file if does not exists"""
    if DEBUG:
        try:
            dir_path = os.path.dirname(LOG_FILEPATH)
            if dir_path and not os.path.exists(dir_path):
                os.makedirs(dir_path)

            if not os.path.exists(LOG_FILEPATH):
                with open(LOG_FILEPATH, "w", encoding="utf-8") as f:
                    f.write("timestamp,log_type,name,msg\n")
        except Exception as e:
            print(f"[{red}ERROR{clear}] Failed to create log file: {e}")


def log(name: str, msg: str, api_route: bool = False) -> None:
    if DEBUG:
        try:
            formatted_msg = msg.replace("\n", "\\n").replace(",", " ").strip()
            small_msg = (
                formatted_msg[:50] + "..." + formatted_msg[-20:]
                if len(formatted_msg) > 70
                else formatted_msg
            )

            if not api_route:
                print(f"[{red}{name}{clear}] {small_msg}")
            else:
                print(f"{red}{name}{clear} {small_msg}")

            with open(LOG_FILEPATH, "a", encoding="utf-8") as f:
                f.write(
                    f"{datetime.datetime.now()},LOG,{name.strip()},{formatted_msg}\n"
                )
        except Exception as e:
            print(f"[{red}ERROR{clear}] debug.log failed: {e}")


def error(name: str, error: str, api_route: bool = False) -> None:
    if DEBUG:
        try:
            formatted_error = error.replace("\n", "\\n").replace(",", " ").strip()
            small_error = (
                formatted_error[:50] + "..." + formatted_error[-20:]
                if len(formatted_error) > 70
                else formatted_error
            )

            if not api_route:
                print(f"[{red}{name}{clear}] {small_error}")
            else:
                print(f"{red}{name}{clear} {small_error}")

            with open(LOG_FILEPATH, "a", encoding="utf-8") as f:
                f.write(
                    f"{datetime.datetime.now()},ERROR,{name.strip()},{formatted_error}\n"
                )
        except Exception as e:
            print(f"[{red}ERROR{clear}] debug.error failed: {e}")
