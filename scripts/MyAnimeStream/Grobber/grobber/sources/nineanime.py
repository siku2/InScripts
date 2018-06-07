import re
from typing import Iterator, List, Tuple

from . import register_source
from ..decorators import cached_property
from ..exceptions import EpisodeNotFound
from ..models import Anime, Episode, SearchResult, Stream, get_certainty
from ..request import Request
from ..streams import get_stream

BASE_URL = "https://9anime.is"
SEARCH_URL = BASE_URL + "/search"
ANIME_URL = BASE_URL + "/watch/{name}"
EPISODE_URL = "http://9animes.co" + "/ajax/episode/info"  # TODO: try to figure out encryption!

RE_SPACE = re.compile(r"\s+")
RE_SPECIAL = re.compile(r"[^\w\-]+")
RE_CLEAN = re.compile(r"-+")

RE_DUB_STRIPPER = re.compile(r"\s\(Dub\)$")


def search_anime_page(name: str, dub: bool = False) -> Iterator[Tuple[Request, float]]:
    req = Request(SEARCH_URL, {"keyword": name})
    bs = req.bs
    container = bs.select_one("div.film-list")
    search_results = container.select("div.item")
    for result in search_results:
        title = result.select_one("a.name").text
        if dub != title.endswith("(Dub)"):
            continue
        link = result.select_one("a.poster")["href"]
        similarity = get_certainty(name, title)
        yield Request(link), similarity


class NineEpisode(Episode):
    @cached_property
    def streams(self) -> List[Stream]:
        return [next(get_stream(Request(self.host_url)))]

    @cached_property
    def host_url(self) -> str:
        return self._req.response.json()["target"]


class NineAnime(Anime):
    EPISODE_CLS = NineEpisode

    @cached_property
    def anime_id(self) -> str:
        return self._req.bs.html["data-ts"]

    @cached_property
    def server_id(self) -> str:
        return self._req.bs.select_one("span.tab.active")["data-name"]

    @cached_property
    def raw_title(self) -> str:
        return self._req.bs.select_one("h2.title").text

    @cached_property
    def title(self) -> str:
        return RE_DUB_STRIPPER.sub("", self.raw_title, 1)

    @cached_property
    def is_dub(self) -> bool:
        return self.raw_title.endswith("(Dub)")

    @cached_property
    def episode_count(self) -> int:
        eps = self._req.bs.select("div.server.active ul.episodes li")
        if not eps:
            return 0
        return len(eps)

    @classmethod
    def search(cls, query: str, dub: bool = False) -> Iterator[SearchResult]:
        for req, certainty in search_anime_page(query, dub=dub):
            yield SearchResult(cls(req), certainty)

    def get_episode(self, index: int) -> NineEpisode:
        if not (0 <= index < self.episode_count):
            raise EpisodeNotFound(index, self.episode_count)
        return self.episodes[index]

    def get_episodes(self) -> List[NineEpisode]:
        eps = self._req.bs.select("div.server ul.episodes.active li")
        episodes = []
        for ep in eps:
            ep_id = ep.a["data-id"]
            params = {"ts": self.anime_id, "id": ep_id}
            # params["_"] = generate_token # TODO: le fix
            req = Request(EPISODE_URL, params)
            episodes.append(self.EPISODE_CLS(req))
        return episodes


register_source(NineAnime)
