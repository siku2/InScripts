import { Page } from "../page";
import { loadSeriesInfo } from "../series";
import { htmlToElement, injectStyle, querySelectorWait } from "../utils";
import { VideoSync } from "../video-sync";

function getOverviewLink(): string {
  const href = document
    .querySelector("#description-ul")
    ?.getElementsByTagName("a")[0]?.href;
  if (!href) {
    throw new Error("episode list link not found");
  }

  return href;
}

const URL_MATCH = /^\/episode-([\w-]+)-s(\d+)e(\d+)-\d+\.html$/;

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

#autostart-btn {
    cursor: pointer;
    height: 100%;
    text-align: center;
    width: 100%;
}

#autostart-btn.active {
    color: #ff361a;
    font-weight: 1000;
}
`;

const PEER_BAR_EL = htmlToElement(`
<li style="display: flex;justify-content: space-evenly;">
    <a id="autostart-btn">Watch Together™</a>
</li>
`) as HTMLElement;

function getEpNumber(): [number, number] {
  const matches = URL_MATCH.exec(location.pathname);
  if (!matches) return [1, 1];

  const rawS = matches[2];
  const rawE = matches[3];

  return [parseInt(rawS, 10), parseInt(rawE, 10)];
}

export class EpisodePage implements Page {
  matches(url: URL): boolean {
    return URL_MATCH.test(url.pathname);
  }

  getSeriesKey(): string | undefined {
    const matches = URL_MATCH.exec(location.pathname);
    if (!matches) return undefined;

    return matches[1];
  }

  patchNextEpisodeButton(key: string): void {
    const [s, e] = getEpNumber();
    const ep = loadSeriesInfo(key)?.getNextEpisode(s, e);

    const nextButton = document.querySelector(
      "#movie-description-box + a"
    ) as HTMLAnchorElement | null;

    if (nextButton) {
      nextButton.removeAttribute("onclick");

      const ref = document.getElementById("movie-description-box");
      nextButton.parentElement?.insertBefore(nextButton, ref);
    }

    if (ep && nextButton) {
      nextButton.href = ep.link;
    } else if (nextButton) {
      console.info("have button but no next episode");
      nextButton.href = getOverviewLink();
    } else if (ep) {
      throw new Error("next episode button not found");
    }
  }

  createVideo(): void {
    const sliderStyle = (document.querySelector(
      "#slider"
    ) as HTMLElement | null)?.style;
    if (!sliderStyle) return;

    sliderStyle.visibility = "hidden";
  }

  stylise(): void {
    injectStyle(CUSTOM_CSS);

    document.querySelector(".watch-info-background")?.remove();
    document.querySelector("#slider.parallax")?.remove();

    const element = document.querySelector("#slider.videostream");
    if (element) {
      element.removeAttribute("id");
      element.classList.remove("slider");
    }

    document.querySelector("#comment-wrapper")?.remove();
    document.querySelector("#download-button")?.remove();

    const [s, e] = getEpNumber();
    document
      .querySelector("#description-ul td:first-child")
      ?.insertAdjacentHTML(
        "afterend",
        `<td><li>Episode</li><li>${s} - ${e}</li></td>`
      );
  }

  async addPeerBar(): Promise<void> {
    const target = document.querySelector("#description-ul td:last-child");
    if (!target) {
      throw new Error("episode description table not found");
    }

    target.append(PEER_BAR_EL);

    const targetButton = document.querySelector("#autostart-btn");
    if (!targetButton) {
      throw new Error("button not found");
    }

    const videoElement = (await querySelectorWait(
      "video",
      "#container_wrapper"
    )) as HTMLVideoElement;

    new VideoSync(videoElement, targetButton).listen();
  }

  onVisit(): void {
    this.stylise();

    this.createVideo();
    this.addPeerBar();

    const key = this.getSeriesKey();
    if (!key) {
      throw new Error("no series key found");
    }

    this.patchNextEpisodeButton(key);
  }
}
