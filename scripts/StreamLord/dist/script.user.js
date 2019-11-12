
// ==UserScript==
// @name         StreamLord
// @version      0.2.0
// @author       siku2
// @description  Turn StreamLord into a passable experience.
// @source       https://github.com/siku2/InScripts/tree/master/scripts/StreamLord
// @updateURL    https://github.com/siku2/InScripts/raw/master/scripts/StreamLord/dist/script.user.js
// @downloadURL  https://github.com/siku2/InScripts/raw/master/scripts/StreamLord/dist/script.user.js
// @match        *://*.streamlord.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function () {
    'use strict';

    class EpisodeInfo {
        constructor(season, number, name, link) {
            this.season = season;
            this.number = number;
            this.name = name;
            this.link = link;
        }
    }
    class SeriesInfo {
        constructor(episodes) {
            this.episodes = episodes;
        }
        getSeason(season) {
            return this.episodes.filter(ep => ep.season === season);
        }
        getEpisode(season, episode) {
            return this.episodes.find(ep => ep.season === season && ep.number == episode);
        }
        getNextEpisode(season, episode) {
            return this.getEpisode(season, episode + 1) || this.getEpisode(season + 1, 1);
        }
        get allEpisodes() {
            return this.episodes;
        }
    }
    function hasSeriesInfo(key) {
        return !!sessionStorage.getItem(key);
    }
    function loadSeriesInfo(key) {
        const raw = sessionStorage.getItem(key);
        if (!raw)
            return undefined;
        return new SeriesInfo(JSON.parse(raw));
    }
    function saveSeriesInfo(key, info) {
        const raw = JSON.stringify(info.allEpisodes);
        sessionStorage.setItem(key, raw);
    }

    function getDirectText(el) {
        return Array.from(el.childNodes)
            .filter(c => c.nodeType == Node.TEXT_NODE)
            .map(c => c.textContent)
            .join('');
    }
    function getSeasonFromElement(el) {
        var _a, _b, _c;
        const seasonText = (_c = (_b = (_a = el.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.season-headline')) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.substring(7);
        if (!seasonText)
            throw Error('season text not found');
        return parseInt(seasonText);
    }
    function epInfoFromElement(el) {
        var _a, _b, _c;
        const headEl = el.querySelector('.head');
        if (!headEl)
            throw Error('head element not found');
        const name = getDirectText(headEl);
        const link = (_b = (_a = el.querySelector('.content .playpic')) === null || _a === void 0 ? void 0 : _a.getElementsByTagName('a')[0]) === null || _b === void 0 ? void 0 : _b.href;
        if (!link)
            throw Error("link not found");
        const epText = (_c = el.querySelector('.head span')) === null || _c === void 0 ? void 0 : _c.textContent;
        if (!epText)
            throw Error('episode text not found');
        const number = parseInt(epText.substring(8));
        return new EpisodeInfo(getSeasonFromElement(el), number, name, link);
    }
    function getEpisodeInfos() {
        return Array
            .from(document.querySelectorAll('#season-wrapper ul > li'))
            .map(epInfoFromElement);
    }
    function parseSeriesInfo() {
        const episodes = getEpisodeInfos();
        return new SeriesInfo(episodes);
    }
    const URL_MATCH = /^\/watch-tvshow-([\w-]+)-\d+\.html$/;
    class OverviewPage {
        matches(url) {
            return URL_MATCH.test(url.pathname);
        }
        getSeriesKey() {
            const matches = URL_MATCH.exec(location.pathname);
            if (!matches)
                return undefined;
            return matches[1];
        }
        onVisit() {
            const key = this.getSeriesKey();
            if (!key)
                throw Error('no series key');
            if (!hasSeriesInfo(key)) {
                const info = parseSeriesInfo();
                saveSeriesInfo(key, info);
            }
        }
    }

    function replaceClass(cl, c1, c2) {
        if (!cl)
            return;
        cl.remove(c1);
        cl.add(c2);
    }
    function injectStyle(css) {
        const el = document.createElement("style");
        el.innerHTML = css;
        document.body.append(el);
    }

    function getOverviewLink() {
        var _a, _b;
        const href = (_b = (_a = document.querySelector("#description-ul")) === null || _a === void 0 ? void 0 : _a.getElementsByTagName("a")[0]) === null || _b === void 0 ? void 0 : _b.href;
        if (!href)
            throw new Error("episode list link not found");
        return href;
    }
    const URL_MATCH$1 = /^\/episode-([\w-]+)-s(\d+)e(\d+)-\d+\.html$/;
    class EpisodePage {
        matches(url) {
            return URL_MATCH$1.test(url.pathname);
        }
        getSeriesKey() {
            const matches = URL_MATCH$1.exec(location.pathname);
            if (!matches)
                return undefined;
            return matches[1];
        }
        getEpNumber() {
            const matches = URL_MATCH$1.exec(location.pathname);
            if (!matches)
                return [1, 1];
            const rawS = matches[2];
            const rawE = matches[3];
            return [parseInt(rawS), parseInt(rawE)];
        }
        patchNextEpisodeButton(key) {
            const nextBtn = document.querySelector("#movie-description-box + a");
            if (!nextBtn)
                throw new Error("next episode button not found");
            nextBtn.removeAttribute("onclick");
            const info = loadSeriesInfo(key);
            if (info) {
                const [s, e] = this.getEpNumber();
                const ep = info.getNextEpisode(s, e);
                if (!ep)
                    return;
                nextBtn.href = ep.link;
            }
            else {
                // TODO add query string which will be read by the overview page.
                nextBtn.href = getOverviewLink();
            }
        }
        createVideo() {
            var _a;
            const sliderStyle = (_a = document.querySelector("#slider")) === null || _a === void 0 ? void 0 : _a.style;
            if (!sliderStyle)
                return;
            sliderStyle.visibility = "hidden";
        }
        stylise() {
            var _a, _b, _c, _d;
            (_a = document.querySelector(".watch-info-background")) === null || _a === void 0 ? void 0 : _a.remove();
            (_b = document.querySelector("#slider.parallax")) === null || _b === void 0 ? void 0 : _b.remove();
            const el = document.querySelector("#slider.videostream");
            if (el) {
                el.removeAttribute("id");
                el.classList.remove("slider");
            }
            (_c = document.querySelector("#comment-wrapper")) === null || _c === void 0 ? void 0 : _c.remove();
            (_d = document.querySelector("#download-button")) === null || _d === void 0 ? void 0 : _d.remove();
            injectStyle(CUSTOM_CSS);
        }
        onVisit() {
            this.createVideo();
            this.stylise();
            const key = this.getSeriesKey();
            if (!key)
                throw new Error("no series key found");
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

    class CommonPage {
        styliseHeader() {
            var _a, _b, _c, _d;
            replaceClass((_a = document.querySelector("#logo")) === null || _a === void 0 ? void 0 : _a.classList, "span_2", "span_8");
            replaceClass((_b = document.querySelector("#menu")) === null || _b === void 0 ? void 0 : _b.classList, "span_7", "span_4");
            document.querySelectorAll(".main-menu > li:not([id])")
                .forEach(el => el.remove());
            (_c = document.querySelector("#account-settings")) === null || _c === void 0 ? void 0 : _c.remove();
            (_d = document.querySelector("#search-outer")) === null || _d === void 0 ? void 0 : _d.remove();
        }
        matches(url) {
            return true;
        }
        onVisit() {
            this.styliseHeader();
        }
    }

    const pages = [
        new CommonPage(),
        new OverviewPage(),
        new EpisodePage(),
    ];
    const url = new URL(location.href);
    for (const page of pages) {
        if (page.matches(url)) {
            page.onVisit();
        }
    }

}());
