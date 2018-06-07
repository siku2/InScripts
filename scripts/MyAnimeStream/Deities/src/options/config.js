const default_config = {
    dub: false,
    replaceStream: false
};

const _config = {};
let _configReady = false;

const _configHandler = {
    async get(obj, prop) {
        if (prop === "all") {
            if (!_configReady) {
                await loadConfig();
                _configReady = true;
            }
            return _config;
        }

        if (prop in obj) {
            return obj[prop];
        } else {
            if (!_configReady) {
                await loadConfig();
                _configReady = true;
            }
            return _config[prop];
        }
    }
};

const config = new Proxy(_config, _configHandler);


async function loadConfig() {
    Raven.captureBreadcrumb({
        message: "loading config...",
        level: "info",
        category: "config"
    });

    Object.assign(_config, default_config);

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
            Object.assign(_config, resp.config);
        }
    }

    Raven.captureBreadcrumb({
        message: "loaded config",
        data: {
            config: _config
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
        data: JSON.stringify(_config)
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
