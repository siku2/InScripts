function patchNoEpisodeTab() {
  const episodeTab = document.querySelector("li a[href$=\"/episode\"]");
  if (!episodeTab) {
    console.log("No Episodes tab found, building my own");
    const preEpisodeTab = document.querySelector("div#horiznav_nav li:nth-child(2)");
    $("<li><a href=" + window.location.pathname + "/episode/1" + ">Watch</a></li>")
      .insertAfter(preEpisodeTab);
  }
}


function showAnimeDetails() {
  patchNoEpisodeTab();

  const atEpisodeContainer = document.getElementById("myinfo_watchedeps");
  const nextEpisode = (parseInt(atEpisodeContainer.getAttribute("value")) + 1) || 1;

  if (nextEpisode <= animeEpisodes) {
    $("<a></a>")
      .text(((nextEpisode == 1) ? "Start" : "Continue") + " Watching")
      .addClass("inputButton btn-middle")
      .css("padding", "4px 12px")
      .css("margin-left", "8px")
      .click(() => window.location.pathname += "/episode/" + nextEpisode.toString())
      .appendTo($("div.user-status-block.js-user-status-block"));
  }
}
