from concurrent.futures import ThreadPoolExecutor
from operator import attrgetter, itemgetter, methodcaller
from typing import Any, Callable, TypeVar

from flask import Flask, Response, jsonify, redirect, request
from werkzeug.routing import BaseConverter

from . import proxy, sources
from .exceptions import GrobberException, InvalidRequest, UIDUnknown
from .source import UID

T = TypeVar("T")
T2 = TypeVar("T2")
_DEFAULT = object()

app = Flask(__name__)


class UIDConverter(BaseConverter):
    def to_python(self, value):
        return UID(value)

    def to_url(self, value):
        return super().to_url(value)


app.url_map.converters["UID"] = UIDConverter

thread_pool = ThreadPoolExecutor(max_workers=5)


def create_response(data: dict = None, success: bool = True, **kwargs) -> Response:
    data = data or {}
    data.update(kwargs)
    data["success"] = success
    return jsonify(data)


def error_response(exception: GrobberException) -> Response:
    data = {
        "msg": exception.msg,
        "code": exception.code,
        "name": type(exception).__name__
    }
    return create_response(data, success=False)


def cast_argument(val: T, cls: Callable[[T], T2], default: Any = _DEFAULT) -> T2:
    try:
        new_val = cls(val)
    except Exception as e:
        if default is _DEFAULT:
            raise e
        else:
            return default
    else:
        return new_val


@app.teardown_appcontext
def teardown(ctx):
    sources.save_cache()


@app.route("/search/<query>")
def search(query: str) -> Response:
    num_results = cast_argument(request.args.get("results"), int, 1)
    if not (0 < num_results <= 10):
        return error_response(InvalidRequest(f"Can only request up to 10 results (not {num_results})"))
    result_iter = sources.search_anime(query, dub=proxy.requests_dub)
    results = []
    for result in result_iter:
        if len(results) >= num_results:
            break
        results.append(result)
    ser_results = sorted(thread_pool.map(methodcaller("to_dict"), results), key=itemgetter("certainty"), reverse=True)
    return create_response(anime=ser_results)


@app.route("/anime/<UID:uid>")
def get_anime(uid: UID) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))
    return create_response(anime.to_dict())


@app.route("/stream/<UID:uid>")
def get_streams(uid: UID) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))
    try:
        raw_episodes = anime.episodes
    except GrobberException as e:
        return error_response(e)
    else:
        episodes = thread_pool.map(attrgetter("host"), raw_episodes)
        return create_response(episodes=list(episodes))


@app.route("/stream/<UID:uid>/<int:episode>")
def get_stream_for_episode(uid: UID, episode: int) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))
    try:
        episode = anime.get_episode(episode)
    except GrobberException as e:
        return error_response(e)
    else:
        return redirect(episode.host)