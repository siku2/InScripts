function addSettingsButton() {
  const nav = document.querySelector("div#horiznav_nav ul");
  if (nav) {
    console.log("Attaching MyAnimeStream settings");
    const liEl = document.createElement("li");
    const aEl = document.createElement("a");
    aEl.setAttribute("href", "/editprofile.php?go=myanimestream");
    aEl.innerText = "MyAnimeStream";
    liEl.appendChild(aEl);
    nav.appendChild(liEl);
  } else {
    console.log("Couldn't find navbar. Not adding Settings!");
    Raven.captureMessage("Couldn't add MyAnimeStream settings button (nav not found)", {
      level: "warning"
    });
  }
}


async function showSettings() {
  console.log("Building settings page");
  document.querySelector("div#horiznav_nav a[href$=myanimestream]")
    .classList.add("horiznav_active");

  const container = document.querySelector("div#content div form")
    .parentElement;

  const html = await $.get(grobberUrl + "/templates/mal/settings", await config.all);
  container.innerHTML = html;
  document.querySelector("input[name=submit]")
    .addEventListener("click", submitSettings);
}


function formParseValue(value) {
  switch (value) {
  case "true":
    return true;
  case "false":
    return false;
  }
}

async function submitSettings() {
  const dataArray = $("div#content div form")
    .serializeArray();

  dataArray
    .forEach((item) => {
      if (config.hasOwnProperty(item.name)) {
        config[item.name] = formParseValue(item.value);
      }
    });

  const success = await saveConfig();

  if (success) {
    $("#update_success_display")
      .show();
  } else {
    $("#update_fail_display")
      .show();
  }
}