import abc
import re
import time
from collections import namedtuple
from contextlib import suppress
from datetime import datetime
from difflib import SequenceMatcher
from typing import Any, Iterator, List, NewType

from .decorators import cached_property
from .request import Request

UID = NewType("UID", str)

RE_UID_CLEANER = re.compile(r"\W+")


def get_certainty(a: str, b: str) -> float:
    return round(SequenceMatcher(a=a, b=b).ratio(), 2)


class SearchResult(namedtuple("SearchResult", ("anime", "certainty"))):
    def to_dict(self):
        return {"anime": self.anime.to_dict(),
                "certainty": self.certainty}


class Episode(abc.ABC):
    _req: Request
    _dirty: bool

    def __init__(self, req: Request):
        self._req = req
        self._dirty = False

    def __repr__(self) -> str:
        return f"Ep. {self._req:!r}"

    @property
    def dirty(self) -> bool:
        return self._dirty

    @dirty.setter
    def dirty(self, value: bool):
        self._dirty = value

    @cached_property
    @abc.abstractmethod
    def host(self) -> str:
        ...

    @property
    def state(self) -> dict:
        data = {"req": self._req.state}
        if hasattr(self, "_host"):
            data["host"] = self._host
        return data

    @classmethod
    def from_state(cls, state: dict) -> "Episode":
        inst = cls(Request.from_state(state["req"]))
        if "host" in state:
            inst._host = state["host"]
        return inst


class Anime(abc.ABC):
    EPISODE_CLS = Episode

    ATTRS = ("uid", "is_dub", "title", "episode_count", "episodes", "last_update")
    CHANGING_ATTRS = ("episode_count", "episodes")
    UPDATE_INTERVAL = 60 * 30  # 30 mins should be fine, right?

    _req: Request
    _dirty: bool
    _last_update: int

    def __init__(self, req: Request):
        self._req = req
        self._dirty = False
        self._last_update = 0

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

    @property
    def _update(self) -> bool:
        current_time = int(time.time())
        if current_time > (self._last_update + self.UPDATE_INTERVAL):
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

    @cached_property
    @abc.abstractmethod
    def is_dub(self) -> False:
        ...

    @cached_property
    @abc.abstractmethod
    def title(self) -> str:
        ...

    @cached_property
    def episode_count(self) -> int:
        return len(self.episodes)

    @cached_property
    @abc.abstractmethod
    def episodes(self) -> List[Episode]:
        ...

    @property
    def state(self) -> dict:
        data = {"req": self._req.state}
        for attr in self.ATTRS:
            val = getattr(self, "_" + attr, None)
            if val is not None:
                if attr == "episodes":
                    val = [ep.state for ep in val]
                data[attr] = val
        return data

    @classmethod
    @abc.abstractmethod
    def get(cls, name: str, dub: bool = False) -> "Anime":
        ...

    @classmethod
    @abc.abstractmethod
    def search(cls, query: str, dub: bool = False) -> Iterator[SearchResult]:
        ...

    @classmethod
    def from_state(cls, state: dict) -> "Anime":
        inst = cls(Request.from_state(state.pop("req")))
        for key, value in state.items():
            if key == "episodes":
                value = [cls.EPISODE_CLS.from_state(ep) for ep in value]
            setattr(inst, "_" + key, value)
        return inst

    def get_episode(self, index: int) -> Episode:
        return self.episodes[index]

    def to_dict(self) -> dict:
        return {"uid": self.uid,
                "title": self.title,
                "episodes": self.episode_count,
                "dub": self.is_dub,
                "updated": datetime.fromtimestamp(self._last_update).isoformat()}
