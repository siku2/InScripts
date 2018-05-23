from typing import Any, Dict

from .lib.babel import compile
from .lib.rjsmin import jsmin


def process(script: str, options: Dict[str, Any]) -> str:
    script = compile(script)
    # script = jsmin(script)
    return script
