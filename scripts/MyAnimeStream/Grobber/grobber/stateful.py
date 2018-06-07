import abc
import re
from datetime import datetime
from typing import Any, Dict, TypeVar

import bson

from .request import Request

VALID_BSON_TYPES = (dict, list, tuple, bson.ObjectId, datetime, re._pattern_type, str, int, float, bool, bytes, type(None))
BsonType = TypeVar("JsonType", *VALID_BSON_TYPES)


def check_container_bson(data: Any) -> bool:
    if isinstance(data, dict):
        for key, value in data.items():
            if not isinstance(key, str):
                return False
            if not check_container_bson(value):
                return False
    elif isinstance(data, (list, tuple)):
        for item in data:
            if not check_container_bson(item):
                return False
    else:
        if not isinstance(data, VALID_BSON_TYPES):
            return False
    return True


class Stateful(abc.ABC):
    __SPECIAL_MARKER = "$state"
    INCLUDE_CLS = False
    ATTRS = ()

    _req: Request
    _dirty: bool

    def __init__(self, req):
        self._req = req

        self.ATTRS = set(attr for base in type(self).__mro__ for attr in getattr(base, "ATTRS", []))
        self._dirty = False

    @property
    def dirty(self) -> bool:
        return self._dirty

    @dirty.setter
    def dirty(self, value: bool):
        self._dirty = value

    def serialise_special(self, key: str, value: Any) -> BsonType:
        ...

    @classmethod
    def deserialise_special(cls, key: str, value: BsonType) -> Any:
        ...

    @property
    def state(self) -> Dict[str, BsonType]:
        data = {"req": self._req.state}
        if self.INCLUDE_CLS:
            data["cls"] = f"{type(self).__module__}.{type(self).__qualname__}"
        for attr in self.ATTRS:
            val = getattr(self, "_" + attr, None)
            if val is not None:
                if not check_container_bson(val):
                    val = self.serialise_special(attr, val)
                    attr += self.__SPECIAL_MARKER
                data[attr] = val
        return data

    @classmethod
    def from_state(cls, state: Dict[str, BsonType]) -> "Stateful":
        inst = cls(Request.from_state(state.pop("req")))
        for key, value in state.items():
            if key.endswith(cls.__SPECIAL_MARKER):
                key = key[:-len(cls.__SPECIAL_MARKER)]
                value = cls.deserialise_special(key, value)
            setattr(inst, "_" + key, value)
        return inst
