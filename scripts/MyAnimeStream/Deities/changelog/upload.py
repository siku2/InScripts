import re
from typing import List, Pattern

RE_VERSION_EXTRACTOR: Pattern = re.compile(r"(\d+)[-.](\d+)[-.](\d+)")
RE_PARSER: Pattern = re.compile(r"^[ \t]*(?<!//)[ \t]*(\w+)(?:\[(\d+)\])?:\s*([\>\|])?\s*(.+?);$", re.S | re.M)
RE_NEWLINE_STRIPPER: Pattern = re.compile(r"\s+")


def parse(text: str) -> List[dict]:
    changes = []
    for match in RE_PARSER.finditer(text):
        change_type, priority, text_style, text = match.groups(None)
        if text_style:
            if text_style == "|":
                text = text.strip()
            elif text_style == ">":
                text = RE_NEWLINE_STRIPPER.sub(" ", text)
            else:
                raise SyntaxError(f"Unknown text style (text_style)") from None
        change = {
            "type": change_type.upper(),
            "text": text
        }
        if priority:
            try:
                priority = int(priority)
            except TypeError:
                priority = None
            if not priority or priority < 0:
                raise SyntaxError(f"Priority must be a positive integer (not {priority})") from None
            change["priority"] = priority
        changes.append(change)
    return changes


if __name__ == "__main__":
    import json
    import sys
    from argparse import ArgumentParser
    from pathlib import Path
    from datetime import datetime

    parser = ArgumentParser("Changelogger", description="A tool to make changelogs easy or something like that")
    parser.add_argument("file", type=open, help="The file you'd like to parse")
    # parser.add_argument("mongo_uri", help="MongoDB uri to connect to")

    args = parser.parse_args()
    filename = Path(args.file.name).stem
    match = RE_VERSION_EXTRACTOR.match(filename)
    if match:
        major, minor, patch = map(int, match.groups())
        version_num = (major << 32) + (minor << 16) + patch
    else:
        version_num = None
        print("Couldn't extract version", file=sys.stderr)
    changes = parse(args.file.read())
    changelog = {
        "changes": changes,
        "version_num": version_num,
        "release": datetime.now().isoformat()
    }
    print(json.dumps(changelog, indent=4))
