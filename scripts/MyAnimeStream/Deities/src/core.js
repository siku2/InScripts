let username;

function addUserContext() {
    if (Raven.isSetup()) {
        const username = unsafeWindow.MAL.USER_NAME;
        if (username) {
            console.log("Set user context for", username);
            Raven.setUserContext({
                username: username,
                mobile: isMobilePage()
            });
        } else {
            console.log("Not logged in");
        }
    }
}


function init() {
    setupPlatform();

    observe();

    addUserContext();

    route();
}

function _init() {
    $(init);
}

if (ravenDSN) {
    Raven.config(ravenDSN, {
        release: GM_info.script.version,
        tags: {
            manager_version: GM_info.version
        }
    }).install();

    console.info("Using Raven DSN!");
    Raven.context(_init);
} else {
    console.warn("No Raven DSN provided, not installing!");
    _init();
}
