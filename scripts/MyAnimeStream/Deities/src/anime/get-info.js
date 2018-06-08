let animeName;
let animeUID;
let animeEpisodes;

async function getAnimeInfo() {
    animeName = document.querySelector("h1>span[itemprop=name]").innerText;
    animeUID = localStorage.getItem(animeName);

    if (animeUID) {
        const data = await $.getJSON(grobberUrl + "/anime/" + animeUID);
        if (data.success) {
            animeEpisodes = data.episodes;
            return true;
        } else {
            console.warn("Unsuccessful request for uid \"" + animeUID + "\":", data);
        }
    }
    console.log("Searching for anime", animeName);
    const result = await $.getJSON(grobberUrl + "/search/" + animeName, {
        dub: await config.dub
    });
    if (!result.success || result.anime.length === 0) {
        console.error("Couldn't find anime \"" + animeName + "\"");
        return false;
    }

    console.log("got answer", result);
    const data = result.anime[0].anime;
    animeUID = data.uid;
    animeEpisodes = data.episodes;
    localStorage.setItem(animeName, animeUID);
    return true;
}
