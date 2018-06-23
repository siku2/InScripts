function fixEpisodePagination() {
    const paginationEl = document.querySelector("div.pagination");
    if (paginationEl) {
        // ensure correct details on pagination
    } else {
        // add pagination element
        console.log("there's no pagination")
    }
}

async function showAnimeEpisodes() {
    let episodeTable = document.querySelector("table.episode_list");

    if (episodeTable) {
        console.log("Manipulating existing episode table...");
        const episodeCount = episodeTable.querySelectorAll("tr.episode-list-data").length;
        const lastEpisodeIndex = parseInt(episodeTable.querySelector("tr.episode-list-data:last-child td.episode-number").innerText);
        if (episodeCount === 100) {
            console.log("episode table paginated...");
        } else {
            if (lastEpisodeIndex < animeEpisodes) {
                const episodeTableDescendHeader = document.querySelector("table.episode_list.descend tr.episode-list-header");

                const episodePrefab = document.querySelector("tr.episode-list-data").cloneNode(true);
                episodePrefab.querySelector("td.episode-title")
                    .querySelector("span.di-ib")
                    .innerText = "";
                episodePrefab.querySelector("td.episode-aired").remove();
                episodePrefab.querySelector("td.episode-forum").remove();

                for (let i = lastEpisodeIndex + 1; i < animeEpisodes; i++) {
                    let epIdx = (i + 1).toString();
                    let episodeObject = $(episodePrefab).clone();
                    episodeObject.find("td.episode-number").text(epIdx);
                    episodeObject.find("td.episode-title")
                        .find("a")
                        .text("Episode " + epIdx)
                        .attr("href", "episode/" + epIdx);

                    episodeObject.find("td.episode-video>a")
                        .attr("href", "episode/" + epIdx)
                        .find("img")
                        .attr("alt", "Watch Episode #" + epIdx);

                    episodeObject.appendTo(episodeTable);
                    episodeObject.clone().insertAfter(episodeTableDescendHeader);
                }
            } else {
                console.log("They've done their job, this table is complete");
            }
        }
        fixEpisodePagination();
    } else {
        console.log("Creating episode table...");
        document.querySelector("div.mb4").outerHTML = await $.get(grobberUrl + "/templates/mal/episode/" + animeUID, {offset: currentURL.searchParams.get("offset") || 0});
    }

    const episodeCountDisplay = document.querySelector("h2>span.di-ib");
    episodeCountDisplay.innerText = "(" + animeEpisodes.toString() + "/" + episodeCountDisplay.innerText.split("/")[1];
}
