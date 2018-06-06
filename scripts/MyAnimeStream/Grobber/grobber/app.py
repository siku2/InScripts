from operator import attrgetter, methodcaller

from flask import Flask, Response, redirect, request, url_for
from raven.contrib.flask import Sentry
from werkzeug.routing import BaseConverter

from . import __info__, proxy, sources
from .exceptions import GrobberException, InvalidRequest, UIDUnknown
from .models import UID
from .templates import templates
from .users import users
from .utils import *

app = Flask(__name__)
sentry = Sentry(app)
sentry.client.release = __info__.__version__


class UIDConverter(BaseConverter):
    def to_python(self, value):
        return UID(value)

    def to_url(self, value):
        return super().to_url(value)


app.url_map.converters["UID"] = UIDConverter

app.register_blueprint(templates)
app.register_blueprint(users)


@app.teardown_appcontext
def teardown_appcontext(error):
    proxy.teardown()
    sources.save_dirty()


@app.route("/search/<query>")
def search(query: str) -> Response:
    num_results = cast_argument(request.args.get("results"), int, 1)
    if not (0 < num_results <= 10):
        return error_response(InvalidRequest(f"Can only request up to 10 results (not {num_results})"))
    result_iter = sources.search_anime(query, dub=proxy.requests_dub)
    num_consider_results = max(num_results, 10)
    results_pool = []
    for result in result_iter:
        if len(results_pool) >= num_consider_results:
            break
        results_pool.append(result)
    results = sorted(results_pool, key=attrgetter("certainty"), reverse=True)[:num_results]
    ser_results = list(thread_pool_map(methodcaller("to_dict"), results))
    return create_response(anime=ser_results)


@app.route("/anime/<UID:uid>")
def get_anime(uid: UID) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))
    return create_response(anime.to_dict())


@app.route("/stream/<UID:uid>/<int:index>")
def get_stream_for_episode(uid: UID, index: int) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        return error_response(UIDUnknown(uid))
    try:
        episode = anime.get_episode(index)
    except GrobberException as e:
        return error_response(e)
    if episode.stream.working:
        return redirect(url_for("templates.player", uid=uid, index=index))
    else:
        return redirect(episode.host_url)
