from flask import Blueprint, Response, render_template

from . import sources
from .exceptions import GrobberException, UIDUnknown
from .source import UID
from .utils import *

templates = Blueprint("Templates", __name__, url_prefix="/templates")


@templates.route("/mal/episode/<UID:uid>")
def mal_episode_list(uid: UID) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))
    return render_template("mal/episode_list.html", episode_count=anime.episode_count)


@templates.route("/mal/episode/<UID:uid>/<int:index>")
def mal_episode(uid: UID, index: int) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))

    try:
        episode = anime.get_episode(index)
    except GrobberException as e:
        return error_response(e)
    else:
        return render_template("mal/episode.html", episode_host=episode.host, episode_count=anime.episode_count, episode_index=index)