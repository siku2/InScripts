let config;

const default_config = {
  dub: false
};


async function loadConfig() {
  Raven.captureBreadcrumb({
    message: "loading config...",
    level: "info",
    category: "config"
  });

  config = default_config;

  if (username) {
    let resp;
    try {
      resp = await $.getJSON(grobberUrl + "/user/" + username + "/config");
    } catch (e) {
      Raven.captureMessage("Couldn't retrieve config.", {
        level: "warning",
        extra: {
          error: e
        }
      });
    }

    if (resp && resp.success) {
      Object.assign(config, resp.config);
    }
  }

  Raven.captureBreadcrumb({
    message: "loaded config",
    data: {
      config: config
    },
    level: "info",
    category: "config"
  });
}


async function saveConfig() {
  const resp = await $.ajax({
    type: "POST",
    contentType: "application/json",
    url: grobberUrl + "/user/" + username + "/config",
    data: JSON.stringify(config)
  });

  if (resp.success) {
    console.log("saved config");
    return true;
  } else {
    Raven.captureMessage("Couldn't save config.", {
      level: "warning",
      extra: {
        response: resp
      }
    });
    return false;
  }
}
