__all__ = ["create_response", "error_response", "cast_argument"]

from typing import Any, Callable, TypeVar

from flask import Response, jsonify

from .exceptions import GrobberException

T = TypeVar("T")
T2 = TypeVar("T2")
_DEFAULT = object()


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
