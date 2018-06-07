from flask import Blueprint, Response, render_template, request

from . import sources
from .exceptions import GrobberException, StreamNotFound, UIDUnknown
from .models import UID
from .utils import *

templates = Blueprint("templates", __name__, url_prefix="/templates")


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
        episode = anime[index]
    except GrobberException as e:
        return error_response(e)
    else:
        return render_template("mal/episode.html", episode=episode, episode_count=anime.episode_count, episode_index=index)


@templates.route("/mal/settings")
def mal_settings():
    # MultiDicts have Lists for values (because there can be multiple values for the same key but we don't want that, thus the "to_dict"
    context = request.args.to_dict()
    return render_template("mal/settings.html", **context)


@templates.route("/player/<UID:uid>/<int:index>")
def player(uid: UID, index: int) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))

    try:
        episode = anime[index]
    except GrobberException as e:
        return error_response(e)

    if not episode.stream:
        return error_response(StreamNotFound())

    return render_template("player.html", episode=episode)
