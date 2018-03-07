import re
from collections import namedtuple
from typing import Dict, List

import requests
from bs4 import BeautifulSoup
from bs4.element import Tag

BASE_URL = "https://mugen.spriteclub.tv"

character_cache = {}

CharacterStats = namedtuple("CharacterStats", ("health", "power", "attack", "defense"))
CharacterRecord = namedtuple("CharacterRecord", ("free", "rated", "division", "total"))


class Character:
    def __init__(self, character_id: int, name: str, division: int, stats: CharacterStats, record: CharacterRecord,
                 match_pages_num: int, match_pages: Dict[int, List["Match"]] = None):
        self.character_id = character_id
        self.name = name
        self.division = division
        self.stats = stats
        self.record = record
        self.match_pages_num = match_pages_num
        self._match_pages = match_pages or {}
        self.url = f"{BASE_URL}/character?id={character_id}"

        self.win_chance = record.total[0] / sum(record.total)

    def __str__(self):
        return f"[{self.division}/{self.name} ({self.character_id}) <H:{self.stats.health} P:{self.stats.power} A:{self.stats.attack} D:{self.stats.defense}>]"

    @classmethod
    def from_bs(cls, character_id: int, bs: BeautifulSoup):
        name = bs.select_one("span.character-name").text
        raw_division = re.search(r"(\d+)\w+\sDivision", bs.select_one("div.flex-row").find_all("div")[-1].text)
        if raw_division:
            division = int(raw_division.group(1))
        else:
            division = 6
        stats = CharacterStats(*(int(tag.text) for tag in bs.select("div.character-info.flex-row .character-stat")))
        raw_records = [record.text for record in bs.select("div.character-info div.character-info-elem")]
        records = []
        for raw_record in raw_records:
            match = re.search(r"(\d+)\s-\s(\d+)", raw_record)
            wins, losses = map(int, match.groups())
            records.append((wins, losses))
        wins, losses = zip(*records)
        records.append((sum(wins), sum(losses)))
        record = CharacterRecord(*records)

        match_pages = int(re.search(r"Page\s\d+\sof\s(\d+)", bs.select_one("#bottom-page-controls").text).group(1))
        matches = cls.extract_matches(bs, name)

        return cls(character_id, name, division, stats, record, match_pages, {1: matches})

    @classmethod
    def from_url(cls, url: str):
        match = re.search(r"(?<=\?).*id=(\d+)", url)
        if not match:
            raise ValueError("Couldn't find id of character!")
        character_id = int(match.group(1))
        resp = requests.get(url)
        bs = BeautifulSoup(resp.text, "html.parser")
        return cls.from_bs(character_id, bs)

    @classmethod
    def search(cls, name: str):
        if name not in character_cache:
            resp = requests.get(f"{BASE_URL}/characters?search-name={name}")
            bs = BeautifulSoup(resp.text, "html.parser")
            character_list = bs.select_one("#stat-list").children
            selected = None
            for character in character_list:
                if not isinstance(character, Tag):
                    continue
                selected = f"{BASE_URL}/" + character.a["href"]
                break

            character_cache[name] = cls.from_url(selected) if selected else None
        return character_cache[name]

    @classmethod
    def from_id(cls, _id: int):
        return cls.from_url(f"{BASE_URL}/character?id={_id}")

    @classmethod
    def extract_matches(cls, bs: BeautifulSoup, name: str):
        matches = []
        raw_matches = bs.select("#stat-list div.stat-elem")
        for raw_match in raw_matches:
            match_id = int(raw_match.select_one(".matches-matchid").a.text)
            blue = raw_match.select_one(".matches-bluename").text.strip()
            red = raw_match.select_one(".matches-redname").text.strip()
            win = raw_match.select_one(".matches-winner").span.text
            won = True if win == "Win" else False if win == "Loss" else None
            if won is None:
                continue
            if blue == name:
                winner = "blue" if won else "red"
            elif red == name:
                winner = "red" if won else "blue"
            else:
                continue
            matches.append(Match(match_id, blue, red, winner))
        return matches

    def match_page(self, index: int):
        if index not in self._match_pages:
            start_at = (index - 1) * 100
            resp = requests.get(f"{BASE_URL}/character?id={self.character_id}&startAt={start_at}")
            bs = BeautifulSoup(resp.text, "html.parser")
            matches = self.extract_matches(bs, self.name)
            self._match_pages[index] = matches
        return self._match_pages[index]

    def match_pages(self):
        for index in range(1, self.match_pages_num + 1):
            yield self.match_page(index)

    def matches(self):
        for page in self.match_pages():
            for match in page:
                yield match

    def to_dict(self, level=1):
        data = {
            "id": self.character_id,
            "name": self.name,
            "division": self.division,
            "url": self.url,
            "stats": dict(self.stats._asdict()),
            "win_chance": self.win_chance
        }
        if level >= 1:
            data.update({
                "record": dict(self.record._asdict())
            })
        if level >= 2:
            data.update({
                "matches": [[match.to_dict() for match in page] for page in self.match_pages()]
            })
        return data


class Match:
    def __init__(self, match_id: int, blue: str, red: str, winner: str):
        self.match_id = match_id
        self.blue = blue
        self.red = red
        self.winner = winner

    def __str__(self):
        return f"<Match {self.match_id} \"{self.blue}\" vs \"{self.red}\">"

    def to_dict(self):
        return vars(self)

    def fought_by(self, character: Character):
        return bool(self.colour_of(character))

    def colour_of(self, character: Character):
        if character.name == self.blue:
            return "blue"
        elif character.name == self.red:
            return "red"
        else:
            return None

    def won_by(self, character: Character):
        colour = self.colour_of(character)
        if not colour:
            return None
        else:
            return colour == self.winner


CharacterComparison = namedtuple("CharacterComparison",
                                 ("stats", "record", "matches", "total", "winner", "certainty"))


def compare_chars(blue: Character, red: Character):
    def _diff(b, r):
        if b + r == 0:
            return 0
        return (b - r) / (b + r)

    def diff(attr):
        b = blue
        r = red
        for att in attr.split("."):
            b = getattr(b, att)
            r = getattr(r, att)
        return _diff(b, r)

    health_diff = diff("stats.health")
    power_diff = diff("stats.power")
    attack_diff = diff("stats.attack")
    defense_diff = diff("stats.defense")
    stats_diff = (.5 * health_diff + .25 * power_diff + .5 * attack_diff + 2 * defense_diff) / 3.25

    blue_total_fights = sum(blue.record.total)
    red_total_fights = sum(red.record.total)
    fight_factor = blue_total_fights / red_total_fights

    wins_diff = _diff(blue.record.total[0], int(red.record.total[0] * fight_factor))
    losses_diff = _diff(blue.record.total[1], int(red.record.total[1] * fight_factor))
    record_diff = (2 * wins_diff - losses_diff) / 3

    match_balance = 0
    matches_fought = 0
    for match in blue.matches():
        if not match.fought_by(red):
            continue
        matches_fought += 1
        if match.won_by(blue):
            match_balance += 1
        else:
            match_balance -= 1
    if matches_fought:
        print(f"\"{blue.name}\" fought against \"{red.name}\" {matches_fought} time(s)\nbalance: {match_balance}")
        match_value = (2 / matches_fought) + 1
        match_balance /= matches_fought * match_value

    total_diff = (.1 * stats_diff + record_diff + 1.5 * match_balance) / 2.6
    winner = "blue" if total_diff > 0 else "red"
    certainty = abs(total_diff)

    return CharacterComparison(stats_diff, record_diff, match_balance, total_diff, winner, certainty)
