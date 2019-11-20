import { Page } from "../page";
import {
  EpisodeInfo,
  hasSeriesInfo,
  saveSeriesInfo,
  SeriesInfo
} from "../series";
import { querySelectorWait } from "../utils";

function getDirectText(element: Node): string {
  return Array.from(element.childNodes)
    .filter(c => {
      return c.nodeType === Node.TEXT_NODE;
    })
    .map(c => {
      return c.textContent;
    })
    .join("");
}

function getSeasonFromElement(element: Node): number {
  const seasonText = element.parentElement
    ?.querySelector(".season-headline")
    ?.textContent?.substring(7);
  if (!seasonText) {
    throw new Error("season text not found");
  }

  return parseInt(seasonText);
}

function epInfoFromElement(element: ParentNode & Node): EpisodeInfo {
  const headElement = element.querySelector(".head");
  if (!headElement) {
    throw new Error("head element not found");
  }

  const name = getDirectText(headElement);
  const link = element
    .querySelector(".content .playpic")
    ?.getElementsByTagName("a")[0]?.href;
  if (!link) {
    throw new Error("link not found");
  }

  const epText = element.querySelector(".head span")?.textContent;
  if (!epText) {
    throw new Error("episode text not found");
  }

  const number = parseInt(epText.substring(8));

  return new EpisodeInfo(getSeasonFromElement(element), number, name, link);
}

async function getEpisodeInfos(): Promise<EpisodeInfo[]> {
  const parent = await querySelectorWait("#season-wrapper");

  return Array.from(parent.getElementsByTagName("li")).map(epInfoFromElement);
}

async function parseSeriesInfo(): Promise<SeriesInfo> {
  const episodes = await getEpisodeInfos();

  if (episodes.length === 0) {
    throw new Error("no episodes found!");
  }

  return new SeriesInfo(episodes);
}

async function ensureHasSeriesInfo(key: string): Promise<void> {
  if (hasSeriesInfo(key)) return;

  const info = await parseSeriesInfo();
  saveSeriesInfo(key, info);
}

const URL_MATCH = /^\/watch-tvshow-(.+)-\d+\.html$/;

export class OverviewPage implements Page {
  matches(url: URL): boolean {
    return URL_MATCH.test(url.pathname);
  }

  getSeriesKey(): string | undefined {
    const matches = URL_MATCH.exec(location.pathname);
    if (!matches) {
      return undefined;
    }

    return matches[1];
  }

  onVisit(): void {
    const key = this.getSeriesKey();
    if (!key) {
      throw new Error("no series key");
    }

    ensureHasSeriesInfo(key).catch(reason =>
      alert("Couldn't load series info: " + reason)
    );
  }
}
