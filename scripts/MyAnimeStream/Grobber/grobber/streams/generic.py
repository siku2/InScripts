from typing import List

from . import register_stream
from ..models import Stream
from ..request import Request


class Generic(Stream):
    PRIORITY = 0

    @classmethod
    def can_handle(cls, req: Request) -> bool:
        return True

    @property
    def links(self) -> List[str]:
        return []


register_stream(Generic)
