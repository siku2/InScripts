import importlib
from itertools import chain, zip_longest
from typing import Dict, Iterator, Optional, Set, Type

from ..proxy import anime_collection
from ..models import Anime, SearchResult, UID

_SOURCES = ["gogoanime", "nineanime"]
SOURCES: Dict[str, Type[Anime]] = {}


def register_source(anime: Type[Anime]):
    SOURCES[f"{anime.__module__}.{anime.__qualname__}"] = anime


def _load_sources():
    for SRC in _SOURCES:
        importlib.import_module("." + SRC, __name__)


_load_sources()

CACHE: Set[Anime] = set()


def save_dirty():
    for anime in CACHE:
        if anime.dirty:
            anime_collection.update_one({"_id": anime.uid}, {"$set": anime.state}, upsert=True)
    CACHE.clear()


def get_anime(uid: UID) -> Optional[Anime]:
    doc = anime_collection.find_one(uid)
    if doc:
        cls = SOURCES[doc["cls"]]
        anime = cls.from_state(doc)
        CACHE.add(anime)
        return anime


def search_anime(query: str, dub=False) -> Iterator[SearchResult]:
    sources = [source.search(query, dub=dub) for source in SOURCES.values()]
    result_zip = zip_longest(*sources)
    result_iter = chain(*result_zip)
    for result in result_iter:
        if result is None:
            continue
        anime = result.anime
        CACHE.add(anime)
        yield result
