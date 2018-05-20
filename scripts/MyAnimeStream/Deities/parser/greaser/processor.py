from typing import Any, Dict

from .rjsmin import jsmin


def process(script: str, options: Dict[str, Any]) -> str:
    return jsmin(script)
