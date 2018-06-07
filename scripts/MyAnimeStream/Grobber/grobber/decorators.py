from functools import wraps
from typing import Callable

_DEFAULT = object()


def cached_property(func: Callable):
    cache_name = "_" + func.__name__

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        val = getattr(self, cache_name, False)
        if not val:
            val = func(self, *args, **kwargs)
            setattr(self, cache_name, val)
            if func.__name__ in self.ATTRS:
                self._dirty = True
        return val

    return property(wrapper)
