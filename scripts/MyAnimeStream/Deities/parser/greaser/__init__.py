from pathlib import Path
from typing import Any, Dict

from .merger import combine, merge
from .processor import process
from .scraper import scrape

__version__ = "0.0.2"


def build(source_dir: str, output_dir: str, options: Dict[str, Any] = None):
    scripts, config = scrape(source_dir)
    print(f"Scraped directory. Found {len(scripts)} script file(s)")
    if options is not None:
        config.settings.update(options)
    built_script = merge(scripts, config.merger)
    print(f"Merged scripts. Length: {len(built_script)}")

    if config.processor.get("enabled", True):
        built_script = process(built_script, config.processor)
        print(f"Processed script. Length: {len(built_script)}")
    else:
        print("Processing disabled")

    finished_script = combine(config.header, built_script)
    print("Combined with header")

    out_name = config.header.name.lower() + ".user.js"
    out_file = Path(output_dir) / out_name
    out_file.write_text(finished_script)
