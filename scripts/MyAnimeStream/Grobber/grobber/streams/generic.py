import re
from typing import List, Optional

from . import register_stream
from ..decorators import cached_property
from ..models import Stream
from ..request import Request

RE_URL_MATCHER = r"\b((http(s)?:)?(//)?[/\w.\-]+\.(" + "{suffix}" + r"))\b"

RE_VIDEO_LINK_MATCHER = re.compile(RE_URL_MATCHER.format(suffix="mp4|webm"), re.DOTALL)
RE_IMAGE_LINK_MATCHER = re.compile(RE_URL_MATCHER.format(suffix="jpg|gif|png"), re.DOTALL)


class Generic(Stream):
    PRIORITY = 0

    @classmethod
    def can_handle(cls, req: Request) -> bool:
        return True

    @cached_property
    def poster(self) -> Optional[str]:
        potential_links = RE_IMAGE_LINK_MATCHER.findall(self._req.text)
        return next(potential_links, None)

    @cached_property
    def links(self) -> List[str]:
        potential_links = RE_VIDEO_LINK_MATCHER.findall(self._req.text)
        return Stream.get_successful_links(potential_links)


register_stream(Generic)
