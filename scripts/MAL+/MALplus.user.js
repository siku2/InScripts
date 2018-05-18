// ==UserScript==
// @name     MAL+
// @icon     https://myanimelist.cdn-dena.com/img/sp/icon/apple-touch-icon-256.png
// @include  /^http(?:s)?\:\/\/myanimelist\.net.*$/
// @version  1.3
// @require  https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==

const adSearch = [
    "Notice us",
    "ads help us pay the bills"
];


function adRemove() {
    console.log("triggered ad removal");
    Array.from(document.getElementsByTagName("*"))
        .filter(el => {
            if (!el.firstChild) {
                return false
            }
            let nodeVal = el.firstChild.nodeValue;
            if (!nodeVal) {
                return false;
            }
            return Boolean(adSearch.find(target => nodeVal.includes(target)));
        }).forEach(el => {
        for (let i = 0; i < 5; i++) {
            el = el.parentElement;
        }
        console.log("removed ad", el);
        el.remove();
    });
}

function observe() {
    let observer = new MutationObserver(adRemove);
    observer.observe(document.body, {
        childList: true
    });
    console.log("observing body!");
    adRemove();
}


function injectCSS() {
}

function init() {
    observe();
}

$(init);
