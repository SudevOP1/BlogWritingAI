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
        dir_path = os.path.dirname(LOG_FILEPATH)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path)

        if not os.path.exists(LOG_FILEPATH):
            with open(LOG_FILEPATH, "w") as f:
                f.write("timestamp,log_type,name,msg\n")

        else:
            with open(LOG_FILEPATH, "a") as f:
                f.write("\n")


def log(name: str, msg: str) -> None:
    if DEBUG:
        formatted_msg = msg.replace("\n", "\\n").replace(",", " ")
        small_msg = (
            formatted_msg[:50] + "..." + formatted_msg[-20:]
            if len(formatted_msg) > 70
            else formatted_msg
        )

        print(f"[{yellow}{name}{clear}] {small_msg}")

        with open(LOG_FILEPATH, "a") as f:
            f.write(f"{datetime.datetime.now()},LOG,{name.strip()},{formatted_msg}\n")


def error(name: str, error: str) -> None:
    if DEBUG:
        formatted_error = error.replace("\n", "\\n").replace(",", " ")
        small_error = (
            formatted_error[:50] + "..." + formatted_error[-20:]
            if len(formatted_error) > 70
            else formatted_error
        )

        print(f"[{red}{name}{clear}] {small_error}")

        with open(LOG_FILEPATH, "a") as f:
            f.write(
                f"{datetime.datetime.now()},ERROR,{name.strip()},{formatted_error}\n"
            )
