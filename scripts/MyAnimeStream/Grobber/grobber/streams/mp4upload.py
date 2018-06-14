import json
import logging
import re
from typing import Any, Dict, List, Match, Optional, Pattern

from . import register_stream
from ..decorators import cached_property
from ..models import Stream
from ..request import Request

log = logging.getLogger(__name__)

RE_EXTRACT_CODE: Pattern = re.compile(
    r"<div id=\"player\"><script type='text/javascript'>eval\(function\(p,a,c,k,e,d\){.+?}\('(.+?)',(\d+),\d+,'([\w|]+)'", re.DOTALL
)
RE_EXTRACT_SETUP: Pattern = re.compile(r"player\.setup\(({.+?})\);", re.DOTALL)
RE_JSON_FIXER: Pattern = re.compile(r"(\"\w+\":)\s*,")


def baseN(num, b, numerals="0123456789abcdefghijklmnopqrstuvwxyz"):
    return ((num == 0) and numerals[0]) or (baseN(num // b, b, numerals).lstrip(numerals[0]) + numerals[num % b])


def decode(code: str, radix: int, encoding_map: List[str]) -> str:
    for i in range(len(encoding_map) - 1, 0, -1):
        code = re.sub(r"\b" + baseN(i, radix) + r"\b", encoding_map[i], code)
    return code


def extract_player_data(text: str) -> Optional[Dict[str, Any]]:
    match: Match = RE_EXTRACT_CODE.search(text)
    if match:
        code, radix, encoding_map = match.groups()
        text = decode(code, int(radix), encoding_map.split("|"))
        match: Match = RE_EXTRACT_SETUP.search(text)
        if match:
            json_data = match.group(1).replace("\'", "\"")
            json_data = RE_JSON_FIXER.sub(r"\1null,", json_data)
            return json.loads(json_data)
        else:
            log.debug("Mp4Upload Couldn't find player setup in decrypted code")
    else:
        log.debug("Mp4Upload Couldn't extract encrypted code from page")


class Mp4Upload(Stream):
    ATTRS = ("player_data",)

    HOST = "mp4upload.com"

    @cached_property
    def player_data(self) -> Dict[str, Any]:
        player_data = extract_player_data(self._req.text)
        if player_data:
            return player_data
        else:
            log.debug("Mp4Upload unable to extract player data")
            return {}

    @cached_property
    def poster(self) -> Optional[str]:
        link = self.player_data.get("image")
        if link and Request(link).head_success:
            return link

    @cached_property
    def links(self) -> List[str]:
        source = self.player_data.get("file")
        if source and Request(source).head_success:
            return [source]
        return []


register_stream(Mp4Upload)
