import { Page } from "../page";
import { EpisodeInfo, hasSeriesInfo, saveSeriesInfo, SeriesInfo } from "../series";


function getDirectText(el: Element): string {
    return Array.from(el.childNodes)
        .filter(c => c.nodeType == Node.TEXT_NODE)
        .map(c => c.textContent)
        .join('');
}

function getSeasonFromElement(el: Element): number {
    const seasonText = el.parentElement
        ?.querySelector('.season-headline')
        ?.textContent
        ?.substring(7);
    if (!seasonText) throw Error('season text not found');

    return parseInt(seasonText);
}

function epInfoFromElement(el: Element): EpisodeInfo {
    const headEl = el.querySelector('.head');
    if (!headEl) throw Error('head element not found');

    const name = getDirectText(headEl);
    const link = el.querySelector('.content .playpic')
        ?.getElementsByTagName('a')[0]
        ?.href;
    if (!link) throw Error("link not found");

    const epText = el.querySelector('.head span')?.textContent;
    if (!epText) throw Error('episode text not found');
    const number = parseInt(epText.substring(8));

    return new EpisodeInfo(getSeasonFromElement(el), number, name, link);
}

function getEpisodeInfos(): EpisodeInfo[] {
    return Array
        .from(document.querySelectorAll('#season-wrapper ul > li'))
        .map(epInfoFromElement);
}

function parseSeriesInfo(): SeriesInfo {
    const episodes = getEpisodeInfos();
    return new SeriesInfo(episodes);
}

const URL_MATCH = /^\/watch-tvshow-([\w-]+)-\d+\.html$/

export class OverviewPage implements Page {
    matches(url: URL): boolean {
        return URL_MATCH.test(url.pathname);
    }

    getSeriesKey(): string | undefined {
        const matches = URL_MATCH.exec(location.pathname);
        if (!matches) return undefined;

        return matches[1];
    }

    onVisit(): void {
        const key = this.getSeriesKey();
        if (!key) throw Error('no series key');

        if (!hasSeriesInfo(key)) {
            const info = parseSeriesInfo();
            saveSeriesInfo(key, info);
        }
    }
}