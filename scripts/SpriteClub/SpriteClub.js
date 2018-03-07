// ==UserScript==
// @name     SpriteClub AutoBet
// @icon     https://static-cdn.jtvnw.net/jtv_user_pictures/f699309cdb6efac8-profile_image-300x300.png
// @version  2.0
// @include  https://mugen.spriteclub.tv/
// @grant    GM.getResourceUrl
// @resource modalInject https://gist.githubusercontent.com/siku2/74ae4829a0d426c7c429fd6539c78858/raw/f8424134c07cef711726cee152bbbab9a5cd9d8e/spriteclub_modal.html
// @require  https://code.jquery.com/jquery-3.3.1.min.js
// @require  https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.bundle.min.js
// ==/UserScript==

const serverUrl = "http://localhost:5000";

let autobetActive = true;
let maxBet = .6;
let maxBetValue = 15000;
let minBet = 600;
let allInThreshold = 2000;

let chart;
let setBet;
let setBetTarget;
let currentMoney;


function precisionRound(number, precision) {
  let factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function setupChart() {
  $("#betDiv").css("height", "50%");

  $("#leftSide").append("<canvas id=\"chart\"></canvas>");
  let ctx = $("#chart")[0].getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Money",
        yAxisID: "money",
        borderColor: "#FFF",
        data: []
      }, {
        label: "Gain",
        yAxisID: "gain",
        borderColor: "rgba(106, 231, 244, .6)",
        data: []
      }, {
        label: "Certainty",
        yAxisID: "certainty",
        borderColor: "rgba(154, 244, 106, .6)",
        data: []
      }]
    },
    options: {
      scales: {
        xAxes: [{
          type: "time",
          time: {
            displayFormats: {
              quarter: "h:mm a"
            }
          },
          gridLines: {
            color: "rgba(255, 255, 255, .05)"
          }
        }],
        yAxes: [{
          id: "money",
          position: "left",
          gridLines: {
            color: "rgba(255, 255, 255, .2)"
          },
          scaleLabel: {
            display: true,
            labelString: "Money"
          }
        }, {
          id: "gain",
          position: "right",
          gridLines: {
            color: "rgba(106, 231, 244, .15)",
            zeroLineColor: "rgba(106, 231, 244, 1)",
            zeroLineWidth: 1.5
          },
          scaleLabel: {
            display: true,
            labelString: "Gain",
            fontColor: "rgba(106, 231, 244, .75)"
          },
          ticks: {
            beginAtZero: true,
            fontColor: "rgba(106, 231, 244, .6)"
          }
        }, {
          id: "certainty",
          position: "left",
          gridLines: {
            color: "rgba(154, 244, 106, .1)"
          },
          ticks: {
            min: 0,
            max: 1,
            fontColor: "rgba(154, 244, 106, .3)"
          },
          scaleLabel: {
            display: true,
            labelString: "Certainty"
          }
        }]
      }
    }
  });

  console.log("chart setup");
}

async function setupModal() {
  let resourceUrl = await GM.getResourceUrl("modalInject");
  $.get(resourceUrl).done(data => {
    $(document.body).append(data);
    console.log("modal ready");
  });
}

function calcBet(money) {
  let blueName = document.querySelector("#blueButton").getAttribute("value");
  let redName = document.querySelector("#redButton").getAttribute("value");
  return new Promise((resolve) => {
    $.getJSON(serverUrl + "/compare?blue=" + encodeURIComponent(blueName) + "&red=" + encodeURIComponent(redName))
      .done(data => {
        console.log("response", data);
        resolve({
          money: Math.min(maxBetValue, Math.min(currentMoney, minBet + Math.round(data.comparison.certainty * maxBet * currentMoney))),
          target: data.comparison.total > 0 ? 0 : 1,
          certainty: data.comparison.certainty
        });
      })
      .fail((jqxhr, textStatus, error) => {
        console.log("couldn't load", error);
        resolve({
          money: Math.min(currentMoney, Math.round(maxBet * 2 * Math.random() * minBet)),
          target: Math.random() > .5 ? 0 : 1,
          certainty: 0
        });
      });
  });
}

async function onChange() {
  if (!autobetActive) {
    return;
  }
  if ($("#betUI").is(":visible")) {
    console.log("TIME TO BET THAT MONEY");
    let now = Date.now();
    let money = parseInt($("#balance").text().slice(1).replace(",", ""));
    if (isNaN(money)) {
      console.error("Couldn't determine current balance!");
      return;
    }

    if (money !== currentMoney) {
      chart.data.datasets[0].data.push({
        t: now,
        y: money
      });
      chart.data.datasets[1].data.push({
        t: now,
        y: money - currentMoney
      });
      currentMoney = money;
    }
    if (!Boolean($("#wager").val())) {
      let bet = await calcBet(money);
      chart.data.datasets[2].data.push({
        t: now,
        y: precisionRound(Math.pow(bet.certainty, .3), 2)
      });
      console.log("betting", bet);
      if (money <= allInThreshold) {
        setBet("100%");
      } else {
        setBet(bet.money.toString());
      }
      setBetTarget(bet.target);
      console.log("done betting");
    }
    chart.update();
  }
}

function main() {
  setupModal();
  setupChart();

  setBet = unsafeWindow.setBet;
  setBetTarget = unsafeWindow.bet;

  let obs = new MutationObserver(onChange);
  obs.observe(document.querySelector("#control"), {
    childList: true,
    subtree: true
  });

  console.log("autobet ready!");
}

$(document).ready(main);
