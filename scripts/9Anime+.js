// ==UserScript==
// @name     9Anime+
// @icon     https://pbs.twimg.com/profile_images/782140857424019456/z3_qOFI8.jpg
// @include  /^https:\/\/9anime\.\w{2}\/.*$/
// @version  1.1
// @require  https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==


function init() {
  const node = $("<style>#jwa,#sidebar{display:none}#main{margin-right:0;padding-right:0!important}#player{height:580px!important}div.film-list{display:flex;flex-wrap:wrap;justify-content:center;}.film-list .item{width:auto!important}.film-list .item .inner .poster img{width:auto!important;}</style>");
  node.appendTo("body");
  console.info("[9Anime+] All set");
}

$(document).ready(init);
