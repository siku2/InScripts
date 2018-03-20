import multiprocessing
import re
from collections import namedtuple
from datetime import datetime

import bson
import requests
from bs4 import BeautifulSoup

from SpriteClub import mugen

SimpleMatch = namedtuple("SimpleMatch", ("match_id", "blue", "red", "winner", "started_on"))
_Match = namedtuple("Match", ("match_id", "blue", "red", "winner", "started_on"))


class Match(_Match):
    def to_dict(self):
        data = self._asdict()
        data.update({
            "blue": self.blue.to_dict(level=1),
            "red": self.red.to_dict(level=1)
        })
        return data


def upgrade_match(match: SimpleMatch):
    blue = mugen.Character.search(match.blue)
    if not blue:
        return None
    red = mugen.Character.search(match.red)
    if not red:
        return None
    winner = blue if match.winner == "blue" else red if match.winner == "red" else None
    if not winner:
        return None
    return Match(match.match_id, blue, red, match.winner, match.started_on)


def get_page_bs(index: int):
    start_at = (index - 1) * 100
    resp = requests.get(f"{mugen.BASE_URL}/matches?startAt={start_at}")
    return BeautifulSoup(resp.text, "html.parser")


def extract_matches(bs: BeautifulSoup):
    matches = []
    try:
        raw_matches = bs.select("#stat-list div.stat-elem")
        first_match = raw_matches[0]
    except IndexError:
        print(bs)
        raise
    page_start_datetime = datetime.strptime(first_match.select_one(".matches-starttime").text, "%H:%M %d/%m/%Y")
    for raw_match in raw_matches:
        match_id = int(raw_match.select_one(".matches-matchid").a.text)
        blue = raw_match.select_one(".matches-bluename").text.strip()
        red = raw_match.select_one(".matches-redname").text.strip()
        winner = raw_match.select_one(".matches-winner").text.lower()
        try:
            started_on = datetime.strptime(raw_match.select_one(".matches-starttime").text, "%H:%M")
            started_on = datetime.combine(page_start_datetime.date(), started_on.time())
        except ValueError:
            started_on = page_start_datetime
        matches.append(SimpleMatch(match_id, blue, red, winner, started_on))
    return matches


def extract_matches_from_page(index: int):
    bs = get_page_bs(index)
    page = extract_matches(bs)
    return page


def pages(pool_size=10):
    pool = multiprocessing.Pool(pool_size)
    print(f"Getting first page", flush=True)
    bs = get_page_bs(1)
    total_pages = int(re.search(r"Page\s\d+\sof\s(\d+)", bs.select_one("#bottom-page-controls").text).group(1))
    print(f"now the remaining {total_pages - 1} pages!", flush=True)
    n = 0
    for page in pool.imap_unordered(extract_matches_from_page, range(1, total_pages + 1), chunksize=5):
        n += 1
        print(f"page {n}/{total_pages} ({round(100 * n / total_pages)}%) done!", flush=True)
        yield page


def matches():
    for page in pages():
        for match in page:
            yield match


def filtered_matches(pool_size=3):
    pool = multiprocessing.Pool(pool_size)
    for match in pool.imap_unordered(upgrade_match, matches(), chunksize=5):
        if not match:
            continue
        yield match


def scrape(*, max_matches: int = None):
    valid_matches = []
    print("getting matches!")
    try:
        for ind, match in enumerate(matches()):
            if max_matches and ind >= max_matches:
                break
            valid_matches.append(match._asdict())
    except KeyboardInterrupt:
        print("got'cha!")
    except Exception:
        print("THINGS BROKE! Saving what I can")
    print(f"got {len(valid_matches)} match(es)")
    ser = bson.dumps({"matches": valid_matches})
    with open("data/matches.bson", "wb+") as f:
        f.write(ser)
    print("DONE!")


if __name__ == "__main__":
    scrape()
