// ==UserScript==
// @name     MyAnimeStream
// @icon     https://myanimelist.cdn-dena.com/img/sp/icon/apple-touch-icon-256.png
// @include  /^http(?:s)?\:\/\/myanimelist\.net.*$/
// @version  0.8.2
// @require  https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==

const grobberUrl = "http://localhost:5000";

const adSearch = [
  "Notice us",
  "ads help us pay the bills"
];

let animeName;
let animeUID;
let animeEpisodes;


function adRemove() {
  Array.from(document.getElementsByTagName("*"))
    .filter((el) => {
      if (!el.firstChild) {
        return;
      }
      let nodeVal = el.firstChild.nodeValue;
      if (!nodeVal) {
        return;
      }
      return Boolean(adSearch.find(target => nodeVal.includes(target)));
    })
    .forEach(el => {
      for (let i = 0; i < 5; i++) {
        el = el.parentElement;
      }
      console.log("removed ad", el);
      el.remove();
    });
}

function observe() {
  const observer = new MutationObserver(adRemove);
  observer.observe(document.body, {
    childList: true
  });
  console.log("observing body!");
  adRemove();
}

async function showEpisodePage() {
  function fillSlide(startIndex, episodePrefab) {
    if (!episodePrefab) {
      episodePrefab = $("li.btn-anime:last")
        .clone()
        .removeClass("play")
        .remove("span.icon-pay");
      episodePrefab.find("div.text")
        .html("<span class=\"episode-number\"></span>");
      episodePrefab.find("img.fl-l")
        .attr("src", "http://www.stylemefancy.com/wp-content/themes/pinnace12/assets/images/no-thumbnail-medium.png");
    }

    for (let i = startIndex; i < animeEpisodes; i++) {
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

  const episodeIndex = parseInt(window.location.pathname.match(/^\/anime\/\d+\/[\w-]+\/episode\/(\d+)\/?$/)[1]);
  const episodeStream = grobberUrl + "/stream/" + animeUID + "/" + (episodeIndex - 1)
    .toString();

  const embedContainer = $("div.video-embed.clearfix");
  let episodeSlide = document.querySelector("#vue-video-slide");

  if (embedContainer.length > 0) {
    embedContainer.html($("<iframe></iframe>")
      .attr("src", episodeStream)
      .width(800)
      .height(535));
    $("div.information-right.fl-r.clearfix")
      .remove();
    document.querySelector("div.di-b>a")
      .setAttribute("href", "../episode");
    const episodeSlideCount = parseInt($("li.btn-anime:last span.episode-number")[0].innerText.split(" ")[1]);

    if (episodeSlideCount < animeEpisodes) {
      fillSlide(episodeSlideCount);
    }
  } else {
    const episodeHTML = $(await $.get(grobberUrl + "/static/prefabs/mal_episode.html"));
    episodeHTML.find("span.episode_number")
      .text(episodeIndex);
    episodeHTML.find("#video-embed-iframe")
      .attr("src", episodeStream);

    document.querySelector("td>div.js-scrollfix-bottom-rel>div>div>table>tbody")
      .innerHTML = episodeHTML.html();

    episodeSlide = document.querySelector("#vue-video-slide");
    let episodePrefab = $("li.btn-anime")
      .detach()
      .removeClass("play");
    episodePrefab.find("i.icon-play")
      .hide();
    fillSlide(0, episodePrefab);
    const currentEpisode = document.querySelector("li.btn-anime:nth-child(" + episodeIndex + ")");
    $(currentEpisode)
      .addClass("play")
      .find("i.icon-play")
      .show();
    episodeSlide.style.left = (-currentEpisode.offsetLeft)
      .toString() + "px";
  }
}

async function showEpsiodeOverview() {
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
        .attr("href", epIdx)
        .find("img")
        .attr("alt", "Watch Episode #" + epIdx)

      episodeObject.appendTo(episodeTable);
      episodeObject.clone()
        .insertAfter(episodeTableDescendHeader);
    }
  }

  let episodeTable = document.querySelector("table.episode_list");

  if (episodeTable) {
    const episodeCount = episodeTable.querySelectorAll("tr.episode-list-data")
      .length;
    if (episodeCount < animeEpisodes) {
      fillList(episodeCount);
    }
  } else {
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

async function getAnimeInfo() {
  animeName = document.querySelector("h1>span[itemprop=name]")
    .innerText;

  animeUID = localStorage.getItem(animeName);

  if (animeUID) {
    const data = await $.getJSON(grobberUrl + "/anime/" + animeUID);
    animeEpisodes = data.episodes;
  } else {
    const result = await $.getJSON(grobberUrl + "/search/" + animeName);
    const data = result.anime[0].anime;
    animeUID = data.uid;
    animeEpisodes = data.episodes;
    localStorage.setItem(animeName, animeUID);
  }
}

async function main() {
  const path = window.location.pathname;
  if (path.match(/^\/anime\/\d+\/[\w-]+\/?/)) {
    await getAnimeInfo();
  }

  if (path.match(/^\/anime\/\d+\/[\w-]+\/?$/)) {
    showAnimeDetails();
  } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/?$/)) {
    showEpsiodeOverview();
  } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)) {
    showEpisodePage();
  }

}

function init() {
  observe();
  main();
}

$(document)
  .ready(init);
