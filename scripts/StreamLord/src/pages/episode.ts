import { Page } from "../page";
import { loadSeriesInfo } from "../series";

function getOverviewLink(): string {
    const href = document.querySelector("#description-ul")?.getElementsByTagName("a")[0]?.href;
    if (!href) throw new Error("episode list link not found");
    return href;
}

function replaceClass(cl: DOMTokenList | undefined, c1: string, c2: string): void {
    if (!cl) return;
    cl.remove(c1);
    cl.add(c2);
}

const URL_MATCH = /^\/episode-([\w-]+)-s(\d+)e(\d+)-\d+\.html$/

export class EpisodePage implements Page {
    matches(url: URL): boolean {
        return URL_MATCH.test(url.pathname);
    }

    getSeriesKey(): string | undefined {
        const matches = URL_MATCH.exec(location.pathname);
        if (!matches) return undefined;

        return matches[1];
    }

    getEpNumber(): [number, number] {
        const matches = URL_MATCH.exec(location.pathname);
        if (!matches) return [1, 1];

        const rawS = matches[2];
        const rawE = matches[3];
        return [parseInt(rawS), parseInt(rawE)];
    }

    patchNextEpisodeButton(key: string) {
        const nextBtn = document.querySelector("#movie-description-box + a") as HTMLAnchorElement | null;
        if (!nextBtn) throw new Error("next episode button not found");

        nextBtn.removeAttribute("onclick");

        const info = loadSeriesInfo(key);
        if (info) {
            const [s, e] = this.getEpNumber();
            const ep = info.getNextEpisode(s, e);
            if (!ep) return;

            nextBtn.href = ep.link;
        } else {
            // TODO add query string which will be read by the overview page.
            nextBtn.href = getOverviewLink();
        }
    }

    createVideo() {
        (document.querySelector("#parall") as HTMLDivElement | null)?.click();
    }

    stylise() {
        document.querySelector("#comment-wrapper")?.remove();
        document.querySelector("#download-button")?.remove();

        replaceClass(document.querySelector("#logo")?.classList, "span_2", "span_8");
        replaceClass(document.querySelector("#menu")?.classList, "span_7", "span_4");

        document.querySelectorAll(".main-menu > li:not([id])")
            .forEach(el => el.remove());

        document.querySelector("#account-settings")?.remove();
        document.querySelector("#search-outer")?.remove();
    }

    onVisit(): void {
        this.createVideo();
        this.stylise();

        const key = this.getSeriesKey();
        if (!key) throw new Error("no series key found");

        this.patchNextEpisodeButton(key);
    }
}