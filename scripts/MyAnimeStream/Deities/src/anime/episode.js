async function showAnimeEpisode() {
  const episodeIndex = parseInt(window.location.pathname.match(/^\/anime\/\d+\/[\w-]+\/episode\/(\d+)\/?$/)[1]);
  const embedContainer = $("div.video-embed.clearfix");

  if (embedContainer.length > 0) {
    console.log("Manipulating existing video embed");
    const episodeStream = grobberUrl + "/stream/" + animeUID + "/" + (episodeIndex - 1)
      .toString();
    embedContainer.html($("<iframe allowfullscreen></iframe>")
      .attr("src", episodeStream)
      .width(800)
      .height(535));
    $("div.information-right.fl-r.clearfix")
      .remove();
    document.querySelector("div.di-b>a")
      .setAttribute("href", "../episode");
    const episodeSlideCount = parseInt($("li.btn-anime:last span.episode-number")[0].innerText.split(" ")[1]);

    if (episodeSlideCount < animeEpisodes) {
      const episodeSlide = document.querySelector("#vue-video-slide");

      const episodePrefab = $("li.btn-anime:last")
        .clone()
        .removeClass("play")
        .remove("span.icon-pay");
      episodePrefab.find("div.text")
        .html("<span class=\"episode-number\"></span>");
      episodePrefab.find("img.fl-l")
        .attr("src", "http://www.stylemefancy.com/wp-content/themes/pinnace12/assets/images/no-thumbnail-medium.png");

      for (let i = episodeSlideCount; i < animeEpisodes; i++) {
        const episodeObject = episodePrefab.clone();
        const epIdx = (i + 1)
          .toString();
        episodeObject.find("span.episode-number")
          .text("Episode " + epIdx);
        episodeObject.find("a.link")
          .attr("href", epIdx);

        episodeObject.appendTo(episodeSlide);
      }
    }
  } else {
    console.log("Creating new video embed and page content");
    const episodeHTML = await $.get(grobberUrl + "/templates/mal/episode/" + animeUID + "/" + (episodeIndex - 1)
      .toString());
    document.querySelector("td>div.js-scrollfix-bottom-rel>div>div>table>tbody")
      .innerHTML = episodeHTML;
  }
  document.querySelector("#vue-video-slide")
    .style.left = (-document.querySelector("li.btn-anime.play")
      .offsetLeft)
    .toString() + "px";
}
