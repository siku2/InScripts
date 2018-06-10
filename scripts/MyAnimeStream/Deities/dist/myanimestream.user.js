// ==UserScript==
// @name MyAnimeStream
// @author siku2
// @version 1.0.6
// @description Get the most out of MyAnimeList by turning the page into a streaming site.
// @homepage https://siku2.github.io/
// @downloadURL https://github.com/siku2/InScripts/raw/master/scripts/MyAnimeStream/Deities/dist/myanimestream.user.js
// @icon https://myanimelist.cdn-dena.com/img/sp/icon/apple-touch-icon-256.png
// @include /^http(?:s)?\:\/\/myanimelist\.net.*$/
// @noframes True
// @run-at document-start
// @require https://code.jquery.com/jquery-3.2.1.min.js
// @require https://cdn.ravenjs.com/3.25.1/raven.min.js
// @require https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
// @require https://cdn.plyr.io/3.3.10/plyr.js
// ==/UserScript==
let closeChangelog=(()=>{var e=_asyncToGenerator(function*(){$("div.changelog-popup").remove(),yield config.set("lastVersion",GM_info.script.version),console.log("updated version")});return function(){return e.apply(this,arguments)}})(),showChangelog=(()=>{var e=_asyncToGenerator(function*(e,n){const t=yield $.get(grobberUrl+"/templates/changelog/"+n+"/"+e);$.injectCSS({".changelog-popup":{position:"fixed","z-index":"2000",top:"50%",left:"50%",transform:"translate(-50%, -50%)",height:"90%","box-shadow":"0 0 100vh 10vh hsla(0, 5%, 4%, 0.7)"}}),$("<div class='changelog-popup'></div>").html(t).appendTo("body"),$("button.close-changelog-btn").click(closeChangelog)});return function(n,t){return e.apply(this,arguments)}})(),changelogCheckVersion=(()=>{var e=_asyncToGenerator(function*(){const e=GM_info.script.version,n=yield config.lastVersion;if(!n)return console.log("No remote version... Setting to",e),void(yield config.set("lastVersion",e));versionBiggerThan(e,n)?(console.log("showing changelog"),yield showChangelog(e,n)):console.debug("no new version")});return function(){return e.apply(this,arguments)}})(),route=(()=>{var e=_asyncToGenerator(function*(){const e=window.location.pathname,n=window.location.search;if(settingPaths.indexOf(e)>-1&&addSettingsButton(),e.match(/^\/anime\/\d+\/[\w-]+\/?/)){if(patchNoEpisodeTab(),!(yield getAnimeInfo()))return void _animeNotFoundMsg()}e.match(/^\/anime\/\d+\/[\w-]+\/?$/)?(currentPage=PageEnum.ANIMEDETAILS,showAnimeDetails()):e.match(/^\/anime\/\d+\/[\w-]+\/episode\/?$/)?(currentPage=PageEnum.EPISODES,showAnimeEpsiodes()):e.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)?(currentPage=PageEnum.EPISODE,showAnimeEpisode()):e.match(/^\/animelist\/\w+$/)?(currentPage=PageEnum.ANIMELIST,highlightAnimeWithUnwatchedEpisodes()):e.match(/^\/editprofile\.php$/)&&n.match(/^\?go=myanimestream$/)?(currentPage=PageEnum.SETTINGS,showSettings()):currentPage=PageEnum.UNKNOWN,changelogCheckVersion()});return function(){return e.apply(this,arguments)}})(),postJSON=(()=>{var e=_asyncToGenerator(function*(e,n){return yield $.ajax({type:"POST",contentType:"application/json",url:e,data:JSON.stringify(n)})});return function(n,t){return e.apply(this,arguments)}})(),updateAnimeStatus=(()=>{var e=_asyncToGenerator(function*(e){const n=$("#myinfo_status"),t=$("#myinfo_score"),o=$("#myinfo_watchedeps"),i={csrf_token:$('meta[name="csrf_token"]').attr("content"),anime_id:parseInt($("#myinfo_anime_id").val()),status:parseInt(n.val()),score:parseInt(t.val()),num_watched_episodes:parseInt(o.val())||0};Object.assign(i,e),yield $.post("/ownlist/anime/edit.json",JSON.stringify(i)),n.val(i.status),t.val(i.score),o.val(i.num_watched_episodes)});return function(n){return e.apply(this,arguments)}})(),finishedEpisode=(()=>{var e=_asyncToGenerator(function*(){(yield config.updateAnimeStatus)||console.log("Not updating anime status because of user settings");const e=parseInt($("#curEps").text()),n={status:currentEpisodeIndex>=e?2:1},t=parseInt($("#myinfo_watchedeps").val())||0;currentEpisodeIndex>=t&&(n.num_watched_episodes=currentEpisodeIndex),console.log("updating data to:",n),yield updateAnimeStatus(n)});return function(){return e.apply(this,arguments)}})(),onVideoEnd=(()=>{var e=_asyncToGenerator(function*(){if(yield finishedEpisode(),currentEpisodeIndex+1<animeEpisodes){const e=new URL((currentEpisodeIndex+1).toString(),window.location.href);e.searchParams.set("autoplay","true"),window.location.href=e.toString()}else console.log("reached the last episode")});return function(){return e.apply(this,arguments)}})(),onPageLeave=(()=>{var e=_asyncToGenerator(function*(e){if(!currentPlayer.ended){const e=currentPlayer.currentTime/currentPlayer.duration;e>(yield config.minWatchPercentageForSeen)&&(console.log("Left page with video at "+Math.round(100*e).toString()+"% Counting as finished!"),yield finishedEpisode())}});return function(n){return e.apply(this,arguments)}})(),createPlayer=(()=>{var e=_asyncToGenerator(function*(e){const n=yield $.get(grobberUrl+"/stream/"+animeUID+"/"+(currentEpisodeIndex-1).toString());e.html(n),setupPlyr()});return function(n){return e.apply(this,arguments)}})(),showAnimeEpisode=(()=>{var e=_asyncToGenerator(function*(){currentEpisodeIndex=parseInt(window.location.pathname.match(/^\/anime\/\d+\/[\w-]+\/episode\/(\d+)\/?$/)[1]);const e=$("div.video-embed.clearfix");if(e.length>0){(yield config.replaceStream)?(console.log("Manipulating player"),createPlayer(e),$("div.information-right.fl-r.clearfix").remove()):console.info("Not changing player because of user settings"),document.querySelector("div.di-b>a").setAttribute("href","../episode");const n=parseInt($("li.btn-anime:last span.episode-number")[0].innerText.split(" ")[1]);if(n<animeEpisodes){const e=document.querySelector("#vue-video-slide"),t=$("li.btn-anime:last").clone().removeClass("play").remove("span.icon-pay");t.find("div.text").html('<span class="episode-number"></span>'),t.find("img.fl-l").attr("src","http://www.stylemefancy.com/wp-content/themes/pinnace12/assets/images/no-thumbnail-medium.png");for(let o=n;o<animeEpisodes;o++){const n=t.clone(),i=(o+1).toString();n.find("span.episode-number").text("Episode "+i),n.find("a.link").attr("href",i),n.appendTo(e)}}}else console.log("Creating new video embed and page content"),document.querySelector("td>div.js-scrollfix-bottom-rel>div>div>table>tbody").innerHTML=yield $.get(grobberUrl+"/templates/mal/episode/"+animeUID+"/"+(currentEpisodeIndex-1).toString()),setupPlyr();document.querySelector("#vue-video-slide").style.left=(-document.querySelector("li.btn-anime.play").offsetLeft).toString()+"px"});return function(){return e.apply(this,arguments)}})(),showAnimeEpsiodes=(()=>{var e=_asyncToGenerator(function*(){let e=document.querySelector("table.episode_list");if(e){console.log("Manipulating existing episode table...");const n=e.querySelectorAll("tr.episode-list-data").length;if(n<animeEpisodes){const t=document.querySelector("table.episode_list.descend tr.episode-list-header"),o=document.querySelector("tr.episode-list-data").cloneNode(!0);o.querySelector("td.episode-title").querySelector("span.di-ib").innerText="",o.querySelector("td.episode-aired").remove(),o.querySelector("td.episode-forum").remove();for(let i=n;i<animeEpisodes;i++){let n=(i+1).toString(),r=$(o).clone();r.find("td.episode-number").text(n),r.find("td.episode-title").find("a").text("Episode "+n).attr("href","episode/"+n),r.find("td.episode-video>a").attr("href","episode/"+n).find("img").attr("alt","Watch Episode #"+n),r.appendTo(e),r.clone().insertAfter(t)}}}else console.log("Recreating episode table..."),document.querySelector("div.mb4").outerHTML=yield $.get(grobberUrl+"/templates/mal/episode/"+animeUID);const n=document.querySelector("h2>span.di-ib");n.innerText="("+animeEpisodes.toString()+"/"+n.innerText.split("/")[1]});return function(){return e.apply(this,arguments)}})(),findAnimeUID=(()=>{var e=_asyncToGenerator(function*(e){_animeUidCache||(_animeUidCache=JSON.parse(localStorage.getItem("AnimeUIDs"))||{});const n=yield config.dub,t=_animeUidCache[n?"dub":"sub"];if(t)return t[e]});return function(n){return e.apply(this,arguments)}})(),setAnimeUID=(()=>{var e=_asyncToGenerator(function*(e,n){_animeUidCache||(_animeUidCache=JSON.parse(localStorage.getItem("AnimeUIDs"))||{});const t=(yield config.dub)?"dub":"sub",o=_animeUidCache[t];o?o[e]=n:_animeUidCache[t]={[e]:n},localStorage.setItem("AnimeUIDs",JSON.stringify(_animeUidCache))});return function(n,t){return e.apply(this,arguments)}})(),getAnimeInfo=(()=>{var e=_asyncToGenerator(function*(){if(animeName=document.querySelector("h1>span[itemprop=name]").innerText,animeUID=yield findAnimeUID(animeName)){const e=yield $.getJSON(grobberUrl+"/anime/"+animeUID);if(e.success)return animeEpisodes=e.episodes,!0;console.warn('Unsuccessful request for uid "'+animeUID+'":',e)}console.log("Searching for anime",animeName);const e=yield $.getJSON(grobberUrl+"/search/"+animeName,{dub:yield config.dub});if(!e.success||0===e.anime.length)return console.error("Couldn't find anime \""+animeName+'"'),!1;console.log("got answer",e);const n=e.anime[0].anime;return animeUID=n.uid,animeEpisodes=n.episodes,yield setAnimeUID(animeName,animeUID),!0});return function(){return e.apply(this,arguments)}})(),getCurrentlyWatchingAnimeList=(()=>{var e=_asyncToGenerator(function*(){let e;for(;!e||e.length<=1;)e=$("table.list-table tbody.list-item"),yield sleep(100);const n=e.filter(function(e,n){return $(n).find("td.data.status").hasClass("watching")}),t=[];for(const e of n)t.push(new AnimeListEntry($(e)));return t});return function(){return e.apply(this,arguments)}})(),highlightAnimeWithUnwatchedEpisodes=(()=>{var e=_asyncToGenerator(function*(){injectBalloonCSS();const e=yield getCurrentlyWatchingAnimeList(),n={};for(item of e)(yield item.uid)&&(n[yield item.uid]=item);const t=yield postJSON(grobberUrl+"/anime/episode-count",Object.keys(n));t.success?(Object.entries(t.anime).forEach(function([e,t]){return n[e].latestEpisode=t}),e.forEach(function(e){return e.show()}),$.injectCSS({"span.episode-status.new-episode":{"font-weight":"bolder",color:"#787878 !important"}})):console.warn("Got turned down when asking for episode counts: ",t)});return function(){return e.apply(this,arguments)}})(),loadConfig=(()=>{var e=_asyncToGenerator(function*(){if(Object.assign(_config,default_config),username){let e;try{e=yield $.getJSON(grobberUrl+"/user/"+username+"/config")}catch(e){console.warn("couldn't load config"),Raven.captureMessage("Couldn't retrieve config.",{level:"warning",extra:{error:e}})}e&&e.success&&(Object.assign(_config,e.config),console.log("loaded config"))}else console.warn("Can't load config (user not logged in)")});return function(){return e.apply(this,arguments)}})(),saveConfig=(()=>{var e=_asyncToGenerator(function*(){if(username){console.debug("saving config");const e=yield postJSON(grobberUrl+"/user/"+username+"/config",_config);return e.success?(console.log("saved config"),!0):(Raven.captureMessage("Couldn't save config.",{level:"warning",extra:{response:e}}),!1)}console.warn("can't save config (user not logged in)")});return function(){return e.apply(this,arguments)}})(),showSettings=(()=>{var e=_asyncToGenerator(function*(){console.log("Building settings page"),document.querySelector("div#horiznav_nav a[href$=myanimestream]").classList.add("horiznav_active"),document.querySelector("div#content div form").parentElement.innerHTML=yield $.get(grobberUrl+"/templates/mal/settings",yield config.all),document.querySelector("input[name=submit]").addEventListener("click",submitSettings)});return function(){return e.apply(this,arguments)}})(),submitSettings=(()=>{var e=_asyncToGenerator(function*(){$("div#content div form").serializeArray().forEach(function(e){config[e.name]=formParseValue(e.value)}),(yield saveConfig())?$("#update_success_display").show():$("#update_fail_display").show()});return function(){return e.apply(this,arguments)}})();function _asyncToGenerator(e){return function(){var n=e.apply(this,arguments);return new Promise(function(e,t){return function o(i,r){try{var a=n[i](r),s=a.value}catch(e){return void t(e)}if(!a.done)return Promise.resolve(s).then(function(e){o("next",e)},function(e){o("throw",e)});e(s)}("next")})}}const grobberUrl="https://mas.dokkeral.com",ravenDSN="https://1d91640d1e45402c9a8f80e74c24658b@sentry.io/1207280",adSearch=["Notice us","ads help us pay the bills"];function adRemove(){Array.from(document.getElementsByTagName("*")).filter(e=>{if(!e.firstChild)return;let n=e.firstChild.nodeValue;return n?Boolean(adSearch.find(e=>n.includes(e))):void 0}).forEach(e=>{for(let n=0;n<5;n++)e=e.parentElement;console.log("removed ad",e),e.remove()})}function observe(){new MutationObserver(adRemove).observe(document.body,{childList:!0}),console.log("observing body!"),adRemove()}function isMobilePage(){let e=null;return null===e&&(e=!!document.querySelector("a.footer-desktop-button")),e}function setupPlatform(){console.log("settings up platform"),isMobilePage()&&(console.log("running on mobile version"),alert("The mobile version of this script is still in development."))}const settingPaths=["/editprofile.php","/notification/setting","/ownlist/style","/account/payment"],PageEnum=Object.freeze({UNKNOWN:-1,GENERAL:0,SETTINGS:1,ANIMELIST:2,ANIME:100,ANIMEDETAILS:101,EPISODES:102,EPISODE:103});let currentPage,currentPlayer,currentEpisodeIndex,_animeUidCache,animeName,animeUID,animeEpisodes;function sleep(e){return new Promise(n=>setTimeout(n,e))}function _animeNotFoundMsg(){const e=animeName.replace(/\W+/g,"").toLowerCase();console.log(e);const n="already-warned-"+e;if(Cookies.get(n))console.log("Already warned about missing anime");else{let e="Couldn't find \""+animeName+'"!';Raven.isSetup()&&(e+=" A report has been created for you and you can expect for this anime to be available soon",Raven.captureMessage('Anime "'+animeName+'" not found.',{level:"info"})),Cookies.set(n,"true",{expires:1}),alert(e)}}function injectBalloonCSS(){$('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/balloon-css/0.5.0/balloon.min.css">').appendTo("head")}function versionBiggerThan(e,n){if(e===n)return null;const t=e.split("."),o=n.split("."),i=Math.min(t.length,o.length);for(let e=0;e<i;e++){if(parseInt(t[e])>parseInt(o[e]))return!0;if(parseInt(t[e])<parseInt(o[e]))return!1}return t.length>o.length||!(t.length<o.length)&&void 0}function patchNoEpisodeTab(){if(!document.querySelector('li a[href$="/episode"]')){console.log("No Episodes tab found, building my own");const e=document.querySelector("div#horiznav_nav li:nth-child(2)"),n=$("<li><a href="+window.location.pathname+"/episode/1>Watch</a></li>");document.querySelector("a.horiznav_active")||n.find("a").addClass("horiznav_active"),n.insertAfter(e)}}function showAnimeDetails(){const e=document.getElementById("myinfo_watchedeps"),n=parseInt(e.getAttribute("value"))+1||1;n<=animeEpisodes&&$("<a></a>").text((1===n?"Start":"Continue")+" Watching").addClass("inputButton btn-middle").css("padding","4px 12px").css("margin-left","8px").click(()=>window.location.pathname+="/episode/"+n.toString()).appendTo($("div.user-status-block.js-user-status-block"))}function setupPlyr(){document.getElementById("player")?((currentPlayer=new Plyr("#player")).on("ended",onVideoEnd),window.addEventListener("beforeunload",onPageLeave),console.log(currentPlayer)):console.warn("Couldn't find player, assuming this is an embed!")}class AnimeListEntry{constructor(e){this.el=e}get name(){return this.el.find("td.title a.link").text()}get link(){return this.el.find("td.title a.link").attr("href")}get uid(){return findAnimeUID(this.name)}get uidValid(){var e=this;return _asyncToGenerator(function*(){return(yield e.uid)&&void 0!==e._latestEpisode})()}get airing(){return"Airing"===this.el.find("span.content-status").text().trim()}get latestEpisode(){return this._latestEpisode}set latestEpisode(e){this._latestEpisode=e}get currentEpisode(){return parseInt(this.el.find("td.progress span a").text())}get nNewEpisodes(){return this.latestEpisode?this.latestEpisode-this.currentEpisode:0}show(){var e=this;return _asyncToGenerator(function*(){let n,t,o;const i=["content-status","episode-status"];if((yield e.uidValid)?e.nNewEpisodes>0&&e.airing&&(n=1===e.nNewEpisodes?"new episode!":"new episodes!",i.push("new-episode"),t="There "+(1===e.nNewEpisodes?"is an episode":"are "+e.nNewEpisodes.toString()+" episodes")+" you haven't watched yet!",o=function(){return window.location.pathname=e.link+"/episode/"+(e.currentEpisode+1).toString()}):(yield e.uid)?(n="uid invalid",t="There was an UID cached but the server didn't accept it. Just open the anime page and it should fix itself"):(n="unknown uid",t="There was no UID cached. Just open the anime page and it should fix itself"),n){const r=e.el.find("td.title span.content-status");r.is(":visible")&&(n="| "+n);const a=$("<span></span>").text(n);i.forEach(function(e){return a.addClass(e)}),t&&(a.attr("data-balloon-pos","up"),a.attr("data-balloon",t)),o&&a.click(o),r.after(a)}})()}}!function(jQuery){"use strict";function toCSS(jss,options){function jsonToCSS(e,n){for(var t in e&&!result[e]&&(result[e]={}),n){var o=n[t];if(o instanceof Array)for(var i=o,r=0;r<i.length;r++)addProperty(e,t,i[r]);else switch(typeof o){case"number":case"string":addProperty(e,t,o);break;case"object":var a=t.charAt(t.length-1);if(!e||"_"!==a&&"-"!==a)jsonToCSS(makeSelectorName(e,t),o);else{var s=o;for(var l in s)for(var c=l.split(/\s*,\s*/),d=0;d<c.length;d++){var u=s[l];if(u instanceof Array)for(var p=u,f=0;f<p.length;f++)addProperty(e,t+c[d],p[f]);else addProperty(e,t+c[d],s[l])}}}}}function makePropertyName(e){return e.replace(/_/g,"-")}function makeSelectorName(e,n){for(var t=[],o=n.split(/\s*,\s*/),i=e.split(/\s*,\s*/),r=0;r<i.length;r++)for(var a=i[r],s=0;s<o.length;s++){var l=o[s];"&"===l.charAt(0)?t.push(a+l.substr(1)):t.push(a?a+" "+l:l)}return t.join(", ")}function addProperty(e,n,t){"number"!=typeof t||options.useRawValues||(t+="px");for(var o=n.split(/\s*,\s*/),i=0;i<o.length;i++){var r=makePropertyName(o[i]);result[e][r]?result[e][r].push(t):result[e][r]=[t]}}var result={};if("string"==typeof jss)try{eval("var jss = {"+jss+"}")}catch(e){return"/*\nUnable to parse JSS: "+e+"\n*/"}jsonToCSS("",jss);var ret="";for(var a in result){var css=result[a];for(var i in ret+=a+" {\n",css)for(var values=css[i],j=0;j<values.length;j++)ret+="\t"+i+": "+values[j]+";\n";ret+="}\n"}return ret}var defaults={truncateFirst:!1,container:null,containerName:"injectCSSContainer",useRawValues:!1};jQuery.injectCSS=function(e,n){(n=jQuery.extend({},defaults,n)).media=n.media||"all";var t=n.container&&jQuery(n.container)||jQuery("#"+n.containerName);t.length||(t=jQuery("<style></style>").appendTo("head").attr({media:n.media,id:n.containerName,type:"text/css"}));var o=t[0],i=void 0!==o.styleSheet&&void 0!==o.styleSheet.cssText,r="";return n.truncateFirst||(r+=i?o.styleSheet.cssText:t.text()),r+=toCSS(e,n),i?o.styleSheet.cssText=r:t.text(r),t}}(jQuery);const default_config={lastVersion:null,dub:!1,replaceStream:!0,updateAnimeStatus:!0,minWatchPercentageForSeen:.75},_config={set:(e,n)=>_asyncToGenerator(function*(){_config[e]=n,yield saveConfig()})()};let _configReady=!1;const _configHandler={get:(e,n)=>n in e?e[n]:_asyncToGenerator(function*(){return"all"===n?(_configReady||(yield loadConfig(),_configReady=!0),_config):(_configReady||(yield loadConfig(),_configReady=!0),_config[n])})()},config=new Proxy(_config,_configHandler);function addSettingsButton(){const e=document.querySelector("div#horiznav_nav ul");if(e){console.log("Attaching MyAnimeStream settings");const n=document.createElement("li"),t=document.createElement("a");t.setAttribute("href","/editprofile.php?go=myanimestream"),t.innerText="MyAnimeStream",n.appendChild(t),e.appendChild(n)}else console.log("Couldn't find navbar. Not adding Settings!"),Raven.captureMessage("Couldn't add MyAnimeStream settings button (nav not found)",{level:"warning"})}function formParseValue(e){switch(e){case"true":return!0;case"false":return!1}}let username;function addUserContext(){Raven.isSetup()&&((username=unsafeWindow.MAL.USER_NAME)?(console.log("Set user context for",username),Raven.setUserContext({username:username,mobile:isMobilePage()})):console.log("Not logged in"))}function init(){setupPlatform(),observe(),addUserContext(),route()}function _init(){$(init)}ravenDSN?(Raven.config(ravenDSN,{release:GM_info.script.version,tags:{manager_version:GM_info.version}}).install(),console.info("Using Raven DSN!"),Raven.context(_init)):(console.warn("No Raven DSN provided, not installing!"),_init());
