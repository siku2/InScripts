from flask import request
from werkzeug.local import LocalProxy


def _requests_dub():
    val = request.args.get("dub")
    if val is None or val.lower() in ("0", "false", "f", "no"):
        return False
    return True


requests_dub = LocalProxy(_requests_dub)
