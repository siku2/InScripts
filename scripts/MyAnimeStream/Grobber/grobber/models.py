import abc
import importlib
import re
from collections import namedtuple
from contextlib import suppress
from datetime import datetime
from difflib import SequenceMatcher
from operator import attrgetter
from typing import Any, Dict, Iterable, Iterator, List, NewType, Optional

from .decorators import cached_property
from .request import Request
from .stateful import BsonType, Stateful
from .utils import thread_pool_map

UID = NewType("UID", str)

RE_UID_CLEANER = re.compile(r"\W+")


def get_certainty(a: str, b: str) -> float:
    return round(SequenceMatcher(a=a, b=b).ratio(), 2)


class SearchResult(namedtuple("SearchResult", ("anime", "certainty"))):
    def to_dict(self):
        return {"anime": self.anime.to_dict(),
                "certainty": self.certainty}


class Stream(Stateful, abc.ABC):
    INCLUDE_CLS = True
    ATTRS = ("links",)
    PRIORITY = 1

    def __iter__(self):
        return iter(self.links)

    @classmethod
    @abc.abstractmethod
    def can_handle(cls, req: Request) -> bool:
        ...

    @property
    @abc.abstractmethod
    def links(self) -> List[str]:
        ...

    @property
    def poster(self) -> Optional[str]:
        return None

    @property
    def working(self) -> bool:
        return len(self.links) > 0

    @staticmethod
    def get_successful_links(sources: Iterable[Request]) -> List[str]:
        all(thread_pool_map(attrgetter("head_success"), sources))
        return [source.url for source in sources if source.head_success]


class Episode(Stateful, abc.ABC):
    ATTRS = ("streams", "host_url")

    def __init__(self, req: Request):
        super().__init__(req)

    def __repr__(self) -> str:
        return f"Ep. {repr(self._req)}"

    @property
    def dirty(self) -> bool:
        return self._dirty

    @dirty.setter
    def dirty(self, value: bool):
        self._dirty = value

    @property
    @abc.abstractmethod
    def streams(self) -> List[Stream]:
        ...

    @property
    def stream(self) -> Optional[Stream]:
        return next((stream for stream in self.streams if stream.working), None)

    @property
    def poster(self) -> Optional[str]:
        return next((stream.poster for stream in self.streams if stream.poster), None)

    @property
    @abc.abstractmethod
    def host_url(self) -> str:
        ...

    def serialise_special(self, key: str, value: Any) -> BsonType:
        if key == "streams":
            return [stream.state for stream in value]

    @classmethod
    def deserialise_special(cls, key: str, value: BsonType) -> Any:
        if key == "streams":
            streams = []
            for stream in value:
                m, c = stream["cls"].rsplit(".", 1)
                stream_cls = getattr(importlib.import_module(m), c)
                streams.append(stream_cls.from_state(value))
            return streams


class Anime(Stateful, abc.ABC):
    EPISODE_CLS = Episode

    INCLUDE_CLS = True
    ATTRS = ("id", "is_dub", "title", "episode_count", "episodes", "last_update")
    CHANGING_ATTRS = ("episode_count", "episodes")
    UPDATE_INTERVAL = 60 * 30  # 30 mins should be fine, right?

    _last_update: datetime

    def __init__(self, req: Request):
        super().__init__(req)
        self._dirty = False
        self._last_update = datetime.now()

    def __getattribute__(self, name: str) -> Any:
        if name in type(self).CHANGING_ATTRS:
            if self._update:
                for attr in type(self).CHANGING_ATTRS:
                    with suppress(AttributeError):
                        delattr(self, f"_{attr}")
        return super().__getattribute__(name)

    def __len__(self) -> int:
        return self.episode_count

    def __repr__(self) -> str:
        return self.uid

    def __str__(self) -> str:
        return self.title

    def __eq__(self, other: "Anime") -> bool:
        return self.uid == other.uid

    def __hash__(self) -> int:
        if hasattr(self, "_uid") or hasattr(self._req, "_response"):
            return hash(self.uid)
        return hash(self._req)

    @property
    def _update(self) -> bool:
        current_time = datetime.now()
        if (current_time - self._last_update).total_seconds() > self.UPDATE_INTERVAL:
            self._last_update = current_time
            return True
        return False

    @property
    def dirty(self) -> bool:
        if self._dirty:
            return True
        else:
            if hasattr(self, "_episodes"):
                return any(ep.dirty for ep in self._episodes)
            return False

    @dirty.setter
    def dirty(self, value: bool):
        self._dirty = value
        if hasattr(self, "_episodes"):
            for ep in self._episodes:
                ep.dirty = value

    @cached_property
    def uid(self) -> UID:
        name = RE_UID_CLEANER.sub("", type(self).__name__.lower())
        anime = RE_UID_CLEANER.sub("", self.title.lower())
        dub = "-dub" if self.is_dub else ""
        return UID(f"{name}-{anime}{dub}")

    @property
    def id(self) -> UID:
        return self.uid

    @id.setter
    def id(self, value: UID):
        self._uid = value

    @property
    @abc.abstractmethod
    def is_dub(self) -> False:
        ...

    @property
    @abc.abstractmethod
    def title(self) -> str:
        ...

    @cached_property
    def episode_count(self) -> int:
        return len(self.episodes)

    @property
    @abc.abstractmethod
    def episodes(self) -> List[Episode]:
        ...

    def get_episode(self, index: int) -> Episode:
        return self.episodes[index]

    def to_dict(self) -> Dict[str, BsonType]:
        return {"uid": self.uid,
                "title": self.title,
                "episodes": self.episode_count,
                "dub": self.is_dub,
                "updated": self._last_update.isoformat()}

    @classmethod
    @abc.abstractmethod
    def search(cls, query: str, dub: bool = False) -> Iterator[SearchResult]:
        ...

    def serialise_special(self, key: str, value: Any) -> BsonType:
        if key == "episodes":
            return [ep.state for ep in value]

    @classmethod
    def deserialise_special(cls, key: str, value: BsonType) -> Any:
        if key == "episodes":
            return [cls.EPISODE_CLS.from_state(ep) for ep in value]
