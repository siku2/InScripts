function addUserContext() {
  if (Raven.isSetup()) {
    const usernameContainer = document.querySelector("a.header-profile-link");
    if (usernameContainer) {
      console.log("Set user context.");
      Raven.setUserContext({
        username: usernameContainer.text
      });
    } else {
      console.log("Not logged in");
    }
  }
}


function init() {
  addUserContext();
  observe();
  route();
}

function _init() {
  $(init);
}

if (ravenDSN) {
  Raven.config(ravenDSN, {
      release: GM_info.version
    })
    .install();

  console.info("Using Raven DSN!");
  Raven.context(_init);
} else {
  console.warn("No Raven DSN provided, not installing!");
  _init();
}