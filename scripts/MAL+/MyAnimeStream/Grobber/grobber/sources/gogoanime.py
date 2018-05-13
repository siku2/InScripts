import re
from operator import itemgetter
from typing import Iterator, List, Tuple

from . import register_source
from ..decorators import cached_property
from ..exceptions import EpisodeNotFound
from ..request import Request
from ..source import Anime, Episode, SearchResult, get_certainty

BASE_URL = "https://www2.gogoanime.se"
SEARCH_URL = BASE_URL + "//search.html"
EPISODE_LIST_URL = BASE_URL + "//load-list-episode"
ANIME_URL = BASE_URL + "/category/{name}"

RE_SPACE = re.compile(r"\s+")
RE_SPECIAL = re.compile(r"[^\w\-]+")
RE_CLEAN = re.compile(r"-+")

RE_DUB_STRIPPER = re.compile(r"\s\(Dub\)$")


def get_potential_page_name(name: str) -> str:
    page_name = name.lower()
    page_name = RE_SPACE.sub("-", page_name)
    page_name = RE_SPECIAL.sub("", page_name)
    page_name = RE_CLEAN.sub("-", page_name)
    return page_name


def search_anime_page(name: str, dub: bool = False) -> Iterator[Tuple[Request, float]]:
    req = Request(SEARCH_URL, {"keyword": name})
    bs = req.bs
    container = bs.select_one("ul.items")
    search_results = container.find_all("li")
    for result in search_results:
        image_link = result.find("a")
        title = image_link["title"]
        if dub != title.endswith("(Dub)"):
            continue
        link = BASE_URL + image_link["href"]
        similarity = get_certainty(name, title)
        yield Request(link), similarity


def find_anime_page(name: str, dub: bool = False) -> Request:
    # First just check if we can find the correct page by "guessing" its url
    potential_page_name = get_potential_page_name(name)
    if dub:
        potential_page_name += "-dub"
    req = Request(ANIME_URL.format(name=potential_page_name))
    if req.success:
        return req

    # If that doesn't work just do a basic search
    req = Request(SEARCH_URL, {"keyword": name})
    bs = req.bs
    container = bs.select_one("ul.items")
    search_results = container.find_all("li")
    animes = []
    for result in search_results:
        image_link = result.find("a")
        title = image_link["title"]
        if dub != title.endswith("(Dub)"):
            continue
        link = BASE_URL + image_link["href"]
        similarity = get_certainty(name, title)
        animes.append((title, link, similarity))
    if not animes:
        raise KeyError(f"No anime with name \"{name}\" found")
    anime = max(animes, key=itemgetter(2))
    return Request(anime[1])


class GogoEpisode(Episode):

    @cached_property
    def host(self) -> str:
        return "https:" + self._req.bs.find("iframe")["src"]


class GogoAnime(Anime):
    EPISODE_CLS = GogoEpisode

    @cached_property
    def anime_id(self) -> str:
        return self._req.bs.find(id="movie_id")["value"]

    @cached_property
    def raw_title(self) -> str:
        return self._req.bs.select_one("div.anime_info_body_bg h1").text

    @cached_property
    def title(self) -> str:
        return RE_DUB_STRIPPER.sub("", self.raw_title, 1)

    @cached_property
    def is_dub(self) -> bool:
        return self.raw_title.endswith("(Dub)")

    @cached_property
    def episode_count(self) -> int:
        holder = self._req.bs.select_one("#episode_page a.active")
        if not holder:
            return 0
        return int(holder["ep_end"])

    @cached_property
    def episodes(self) -> List[GogoEpisode]:
        episode_req = Request(EPISODE_LIST_URL, {"id": self.anime_id, "ep_start": 0, "ep_end": self.episode_count})
        episode_links = episode_req.bs.find_all("li")
        episodes = []
        for episode_link in reversed(episode_links):
            episodes.append(self.EPISODE_CLS(Request(BASE_URL + episode_link.a["href"].lstrip())))
        return episodes

    @classmethod
    def search(cls, query: str, dub: bool = False) -> Iterator[SearchResult]:
        for req, certainty in search_anime_page(query, dub=dub):
            yield SearchResult(cls(req), certainty)

    @classmethod
    def get(cls, name: str, dub: bool = False) -> "GogoAnime":
        return cls(find_anime_page(name, dub))

    def get_episode(self, index: int) -> GogoEpisode:
        if not (0 <= index < self.episode_count):
            raise EpisodeNotFound(index, self.episode_count)
        if hasattr(self, "_episodes"):
            return self.episodes[index]
        page_name = get_potential_page_name(self.title)
        return GogoEpisode(Request(f"{BASE_URL}/{page_name}-episode-{index + 1}"))


register_source(GogoAnime)
