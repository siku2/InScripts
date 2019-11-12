import { Page } from "../page";
import { loadSeriesInfo } from "../series";
import { replaceClass, injectStyle } from "../utils";

function getOverviewLink(): string {
    const href = document.querySelector("#description-ul")?.getElementsByTagName("a")[0]?.href;
    if (!href) throw new Error("episode list link not found");
    return href;
}

function fixMonoAudio(video: HTMLVideoElement) {
    const context = new AudioContext();
    // TODO doesn't work because of CORS...
    const source = context.createMediaElementSource(video);

    const splitter = context.createChannelSplitter();
    source.connect(splitter);

    const merger = context.createChannelMerger();
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);

    merger.connect(context.destination);
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
        const sliderStyle = (document.querySelector("#slider") as HTMLElement | null)?.style;
        if (!sliderStyle) return;

        sliderStyle.visibility = "hidden";
    }

    stylise() {
        document.querySelector(".watch-info-background")?.remove();
        document.querySelector("#slider.parallax")?.remove();
        const el = document.querySelector("#slider.videostream");
        if (el) {
            el.removeAttribute("id");
            el.classList.remove("slider");
        }

        document.querySelector("#comment-wrapper")?.remove();
        document.querySelector("#download-button")?.remove();

        injectStyle(CUSTOM_CSS);
    }

    onVisit(): void {
        this.createVideo();
        this.stylise();

        const key = this.getSeriesKey();
        if (!key) throw new Error("no series key found");

        this.patchNextEpisodeButton(key);
    }
}

const CUSTOM_CSS = `
.movie-summary { transition: filter 1s; }

.movie-summary:not(:hover) { filter: blur(1.5px) opacity(60%); }

form.settings-button { visibility: hidden; }

p.search-rating { display: flex; }

p.search-rating::before { content: none !important; }

p.search-rating::after { content: "/10"; }

.watch #slider.videostream { top: unset; }

.header-content {
    align-items: center;
    display: flex;
    margin: 1% 0;
}

#container_wrapper,
header #logo h1 img,
.main-menu { margin-top: unset !important; }

header #logo h1 img { max-width: 100px !important; }

.main-menu > li,
.gradient-header { height: unset; }

.watch .floating-movie,
#movie-description,
#movie-description-box { margin-top: unset !important; }

#movie-description-paragraph { margin-top: 50px !important; }
`;