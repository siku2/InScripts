class AnimeListEntry {
    constructor(el) {
        this.el = el;
    }

    get name() {
        return this.el.find("td.title a.link").text();
    }

    get uid() {
        return localStorage.getItem(this.name);
    }
}

async function getCurrentlyWatchingAnimeList() {
    let allEntries;
    while (!allEntries || allEntries.length <= 1) {
        allEntries = $("table.list-table tbody.list-item");
        await sleep(20);
    }
    const watching = allEntries.filter((idx, el) => $(el).find("td.data.status").hasClass("watching"));
    const watchingList = [];
    for (const el of watching) {
        watchingList.push(new AnimeListEntry($(el)));
    }
    return watchingList;
}

async function highlightAnimeWithUnwatchedEpisodes() {
    const watchingList = await getCurrentlyWatchingAnimeList();
    const uids = [];
    for (item of watchingList) {
        if (item.uid) {
            uids.push(item);
        }
    }
    const resp = await postJSON(grobberUrl + "/anime/episode-count", uids);
    console.log(resp);
}