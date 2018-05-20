function init() {
  observe();
  route();
}

function _init() {
  $(init);
}

if (ravenDSN) {
  Raven.config(ravenDSN)
    .install();

  console.info("Using Raven DSN!");
  Raven.context(_init);
} else {
  console.warn("No Raven DSN provided, not installing!");
  _init();
}
