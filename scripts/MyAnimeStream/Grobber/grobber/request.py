from typing import Any

import requests
from bs4 import BeautifulSoup

from .decorators import cached_property


class Request:
    _url: str
    _response: requests.Response
    _success: bool
    _text: str
    _bs: BeautifulSoup

    def __init__(self, url: str, params: Any = None):
        self._url = url
        self._params = params

    def __repr__(self):
        props = (
            self._response and "REQ",
            self._text and "TXT",
            self._bs and "BS"
        )
        cached = ",".join(filter(None, props))
        return f"<{self.url} ({cached})>"

    @property
    def state(self) -> dict:
        data = {"url": self._url}
        if self._params:
            data["params"] = self._params
        return data

    @classmethod
    def from_state(cls, state: dict) -> "Request":
        inst = cls(state["url"], state.get("params", None))
        return inst

    @cached_property
    def url(self) -> str:
        return requests.Request("GET", self._url, params=self._params).prepare().url

    @url.setter
    def url(self, value: str):
        self._url = value
        self._dirty(3)

    @cached_property
    def response(self) -> requests.Response:
        return requests.get(self.url, params=self._params)

    @response.setter
    def response(self, value: requests.Response):
        self._response = value
        self._dirty(2)

    @cached_property
    def success(self):
        return self.response.ok

    @cached_property
    def text(self) -> str:
        return self.response.text

    @text.setter
    def text(self, value: str):
        self._text = value
        self._dirty(1)

    @cached_property
    def bs(self) -> BeautifulSoup:
        return BeautifulSoup(self.text, "html.parser")

    def _dirty(self, flag: int):
        if flag > 2:
            self._response = None
            self._success = None
        if flag > 1:
            self._text = None
        if flag > 0:
            self._bs = None
