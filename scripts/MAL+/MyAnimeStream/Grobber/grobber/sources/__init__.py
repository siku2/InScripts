import importlib
from itertools import chain, zip_longest
from typing import Iterator, List, Optional, Type

from tinydb import Query, TinyDB

from ..source import Anime, SearchResult, UID

_SOURCES = ["gogoanime"]
SOURCES: List[Type[Anime]] = []


def register_source(anime: Type[Anime]):
    SOURCES.append(anime)


def _load_sources():
    for SRC in _SOURCES:
        importlib.import_module("." + SRC, __name__)


_load_sources()

CACHED_ANIME = {}

db = TinyDB("anime.json")
AnimeDoc = Query()


def load_cache():
    for document in db.all():
        raw_anime = document["data"]
        raw_cls = document["cls"]
        cls = next(src for src in SOURCES if src.__name__ == raw_cls)
        anime = cls.from_state(raw_anime)
        CACHED_ANIME[anime.uid] = anime


def save_cache():
    for anime in CACHED_ANIME.values():
        if anime.dirty:
            db.upsert(dict(uid=anime.uid, data=anime.state, cls=type(anime).__name__), AnimeDoc.uid == anime.uid)


load_cache()


def get_anime(query: UID) -> Optional[Anime]:
    return CACHED_ANIME.get(query)


def search_anime(query: str, dub=False) -> Iterator[SearchResult]:
    sources = [source.search(query, dub=dub) for source in SOURCES]
    result_iter = chain(*zip_longest(*sources))
    for result in result_iter:
        anime = result.anime
        CACHED_ANIME[anime.uid] = anime
        yield result
