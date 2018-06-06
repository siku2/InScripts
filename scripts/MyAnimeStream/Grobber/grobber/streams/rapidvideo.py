from typing import List, Optional

from . import register_stream
from ..decorators import cached_property
from ..models import Stream
from ..request import Request


class RapidVideo(Stream):
    HOST = "www.rapidvideo.com"

    @classmethod
    def can_handle(cls, req: Request) -> bool:
        return req.yarl.host == cls.HOST

    @cached_property
    def poster(self) -> Optional[str]:
        return self._req.bs.select_one("video#videojs").attrs.get("poster")

    @cached_property
    def links(self) -> List[str]:
        sources = (Request(source["src"]) for source in self._req.bs.select("video source"))
        return Stream.get_successful_links(sources)


register_stream(RapidVideo)