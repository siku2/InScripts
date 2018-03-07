// ==UserScript==
// @name     MAL+
// @icon     https://myanimelist.cdn-dena.com/img/sp/icon/apple-touch-icon-256.png
// @include  https://myanimelist.net/anime/*
// @version  1.0
// @require  https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==


function adRemove() {
  console.log("removing ads");
  $("div._unit").has(".fs12").remove();
}

function init() {
  setTimeout(adRemove, 5000);

  let bar = document.getElementsByClassName("user-status-block js-user-status-block fn-grey6 clearfix al mt8 pl12 po-r")[0];

  var customStyle = document.createElement("style");
  customStyle.innerHTML = ".no-after:after{display:none!important;}";
  document.head.appendChild(customStyle);

  if (bar) {
    console.log("Found target bar");
    el = document.createElement("a");
    el.innerHTML = "Find on 9ANIME";
    el.classList.add("btn-user-status-add-list");
    el.classList.add("ml8");
    el.classList.add("no-after");
    el.style.padding = "6px 12px 6px 12px";
    el.addEventListener("click", function() {
      var animeName = encodeURIComponent(document.getElementById("contentWrapper").firstChild.lastChild.firstChild.innerHTML);
      window.open("https://9anime.to/search?language=dubbed&keyword=" + animeName);
    });
    bar.appendChild(el);
  }
}

$(document).ready(init);
