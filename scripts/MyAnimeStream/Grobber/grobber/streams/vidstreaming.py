import re
from typing import List, Optional

from . import register_stream
from ..decorators import cached_property
from ..models import Stream
from ..request import Request
from ..utils import parse_js_json

RE_EXTRACT_SETUP = re.compile(r"playerInstance\.setup\((.+?)\);", re.DOTALL)


def extractPlayerData(text: str) -> dict:
    match = RE_EXTRACT_SETUP.search(text)
    return parse_js_json(match.group(1))


class Vidstreaming(Stream):
    HOST = "vidstreaming.io"

    @classmethod
    def can_handle(cls, req: Request) -> bool:
        return req.yarl.host == cls.HOST

    @cached_property
    def poster(self) -> Optional[str]:
        return extractPlayerData(self._req.text).get("image")

    @cached_property
    def links(self) -> List[str]:
        raw_sources = extractPlayerData(self._req.text)["sources"]
        sources = [Request(source["file"]) for source in raw_sources]
        return Stream.get_successful_links(sources)


register_stream(Vidstreaming)
