class AnimeListEntry {
    constructor(el) {
        this.el = el;
    }

    get name() {
        return this.el.find("td.title a.link").text();
    }

    get link() {
        return this.el.find("td.title a.link").attr("href");
    }

    get uid() {
        return localStorage.getItem(this.name);
    }

    get uidValid() {
        return this.uid && this._latestEpisode !== undefined;
    }

    get airing() {
        return this.el.find("span.content-status").text().trim() === "Airing";
    }

    get latestEpisode() {
        return this._latestEpisode
    }

    set latestEpisode(value) {
        this._latestEpisode = value
    }

    get currentEpisode() {
        return parseInt(this.el.find("td.progress span a").text());
    }

    get nNewEpisodes() {
        if (!this.latestEpisode) {
            return 0;
        }
        return this.latestEpisode - this.currentEpisode;
    }

    show() {
        let text;
        let explanation;
        let onClick;
        const classList = ["content-status", "episode-status"];

        if (this.uidValid) {
            if (this.nNewEpisodes > 0) {
                if (this.airing) {
                    text = (this.nNewEpisodes === 1) ? "new episode!" : "new episodes!";
                    classList.push("new-episode");
                    explanation = "There " +
                        ((this.nNewEpisodes === 1) ? "is an episode" : ("are " + this.nNewEpisodes.toString() + " episodes")) +
                        " you haven't watched yet!";
                    onClick = () => window.location.pathname = this.link + "/episode/" + (this.currentEpisode + 1).toString();
                }
            }
        }
        else if (this.uid) {
            text = "uid invalid";
            explanation = "There was an UID cached but the server didn't accept it. Just open the anime page and it should fix itself";
        } else {
            text = "unknown uid";
            explanation = "There was no UID cached. Just open the anime page and it should fix itself";
        }
        if (text) {
            const beforeElement = this.el.find("td.title span.content-status");
            if (beforeElement.is(":visible")) {
                text = "| " + text;
            }
            const el = $("<span></span>").text(text);
            classList.forEach(cls => el.addClass(cls));
            if (explanation) {
                el.attr("data-balloon-pos", "up");
                el.attr("data-balloon", explanation);
            }
            if (onClick) {
                el.click(onClick);
            }
            beforeElement.after(el);
        }
    }
}

async function getCurrentlyWatchingAnimeList() {
    let allEntries;
    while (!allEntries || allEntries.length <= 1) {
        allEntries = $("table.list-table tbody.list-item");
        await sleep(100);
    }
    const watching = allEntries.filter((idx, el) => $(el).find("td.data.status").hasClass("watching"));
    const watchingList = [];
    for (const el of watching) {
        watchingList.push(new AnimeListEntry($(el)));
    }
    return watchingList;
}

async function highlightAnimeWithUnwatchedEpisodes() {
    injectBalloonCSS();
    const watchingList = await getCurrentlyWatchingAnimeList();
    const uids = {};
    for (item of watchingList) {
        if (item.uid) {
            uids[item.uid] = item;
        }
    }
    const resp = await postJSON(grobberUrl + "/anime/episode-count", Object.keys(uids));
    if (!resp.success) {
        console.warn("Got turned down when asking for episode counts: ", resp);
        return;
    }

    Object.entries(resp.anime).forEach(([uid, epCount]) => uids[uid].latestEpisode = epCount);
    watchingList.forEach(anime => anime.show());

    $.injectCSS({
        "span.episode-status.new-episode": {
            "font-weight": "bolder",
            color: "#787878" + " !important"
        }
    });
}