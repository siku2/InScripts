
// ==UserScript==
// @name         StreamLord
// @version      0.1
// @description  Turn StreamLord into a good experience.
// @author       siku2
// @match        *://*.streamlord.com/*
// @grant        none
// @run-at       document-end
// @require      https://raw.githubusercontent.com/systemjs/systemjs/master/dist/s.min.js
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
    //# sourceMappingURL=series.js.map

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
    //# sourceMappingURL=overview.js.map

    function getOverviewLink() {
        var _a, _b;
        const href = (_b = (_a = document.querySelector("#description-ul")) === null || _a === void 0 ? void 0 : _a.getElementsByTagName("a")[0]) === null || _b === void 0 ? void 0 : _b.href;
        if (!href)
            throw new Error("episode list link not found");
        return href;
    }
    function replaceClass(cl, c1, c2) {
        if (!cl)
            return;
        cl.remove(c1);
        cl.add(c2);
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
            (_a = document.querySelector("#parall")) === null || _a === void 0 ? void 0 : _a.click();
        }
        stylise() {
            var _a, _b, _c, _d, _e, _f;
            (_a = document.querySelector("#comment-wrapper")) === null || _a === void 0 ? void 0 : _a.remove();
            (_b = document.querySelector("#download-button")) === null || _b === void 0 ? void 0 : _b.remove();
            replaceClass((_c = document.querySelector("#logo")) === null || _c === void 0 ? void 0 : _c.classList, "span_2", "span_8");
            replaceClass((_d = document.querySelector("#menu")) === null || _d === void 0 ? void 0 : _d.classList, "span_7", "span_4");
            document.querySelectorAll(".main-menu > li:not([id])")
                .forEach(el => el.remove());
            (_e = document.querySelector("#account-settings")) === null || _e === void 0 ? void 0 : _e.remove();
            (_f = document.querySelector("#search-outer")) === null || _f === void 0 ? void 0 : _f.remove();
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

    const pages = [
        new OverviewPage(),
        new EpisodePage(),
    ];
    const url = new URL(location.href);
    for (const page of pages) {
        if (page.matches(url)) {
            page.onVisit();
            break;
        }
    }
    //# sourceMappingURL=main.js.map

}());
