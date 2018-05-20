async function showAnimeEpsiodes() {
  function fillList(startIndex, episodePrefab) {
    episodeTable = document.querySelector("table.episode_list");
    const episodeTableDescendHeader = document.querySelector("table.episode_list.descend tr.episode-list-header");

    if (!episodePrefab) {
      episodePrefab = document.querySelector("tr.episode-list-data")
        .cloneNode(true);
      episodePrefab.querySelector("td.episode-title")
        .querySelector("span.di-ib")
        .innerText = "";
      episodePrefab.querySelector("td.episode-aired")
        .remove();
      episodePrefab.querySelector("td.episode-forum")
        .remove();
    }

    for (let i = startIndex; i < animeEpisodes; i++) {
      let epIdx = (i + 1)
        .toString();
      let episodeObject = $(episodePrefab)
        .clone();
      episodeObject.find("td.episode-number")
        .text(epIdx);
      episodeObject.find("td.episode-title")
        .find("a")
        .text("Episode " + epIdx)
        .attr("href", "episode/" + epIdx);

      episodeObject.find("td.episode-video>a")
        .attr("href", "episode/" + epIdx)
        .find("img")
        .attr("alt", "Watch Episode #" + epIdx)

      episodeObject.appendTo(episodeTable);
      episodeObject.clone()
        .insertAfter(episodeTableDescendHeader);
    }
  }

  let episodeTable = document.querySelector("table.episode_list");

  if (episodeTable) {
    console.log("Manipulating existing episode table...");
    const episodeCount = episodeTable.querySelectorAll("tr.episode-list-data")
      .length;
    if (episodeCount < animeEpisodes) {
      fillList(episodeCount);
    }
  } else {
    console.log("Recreating episode table...");
    const episodeListHTML = $(await $.get(grobberUrl + "/static/prefabs/mal_episode_list.html"));
    const epPrefab = episodeListHTML.find("tr.episode-list-data")
      .detach()
      .show();

    document.querySelector("div.mb4")
      .outerHTML = episodeListHTML.html();

    fillList(0, epPrefab);
  }

  const episodeCountDisplay = document.querySelector("h2>span.di-ib");
  episodeCountDisplay.innerText = "(" + animeEpisodes.toString() + "/" + episodeCountDisplay.innerText.split("/")[1];
}
