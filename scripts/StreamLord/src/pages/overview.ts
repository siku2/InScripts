import { Page } from "../page";
import {
  EpisodeInfo,
  hasSeriesInfo,
  saveSeriesInfo,
  SeriesInfo
} from "../series";

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

function getEpisodeInfos(): EpisodeInfo[] {
  return Array.from(document.querySelectorAll("#season-wrapper ul > li")).map(
    epInfoFromElement
  );
}

function parseSeriesInfo(): SeriesInfo {
  const episodes = getEpisodeInfos();
  if (episodes.length == 0) {
    alert("refusing to store no episodes");
    throw new Error("no episodes found!");
  }

  return new SeriesInfo(episodes);
}

const URL_MATCH = /^\/watch-tvshow-([\w-]+)-\d+\.html$/;

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

    if (!hasSeriesInfo(key)) {
      const info = parseSeriesInfo();
      saveSeriesInfo(key, info);
    }
  }
}
