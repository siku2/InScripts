function showAnimeDetails() {
  const atEpisodeContainer = document.getElementById("myinfo_watchedeps");
  const nextEpisode = (parseInt(atEpisodeContainer.getAttribute("value")) + 1) || 1;

  if (nextEpisode <= animeEpisodes) {
    $("<a></a>")
      .text(((nextEpisode == 1) ? "Start" : "Continue") + " Watching")
      .addClass("inputButton btn-middle")
      .css("padding", "4px 12px")
      .css("margin-left", "8px")
      .click(() => window.location.href += "/episode/" + nextEpisode.toString())
      .appendTo($("div.user-status-block.js-user-status-block"));
  }
}
