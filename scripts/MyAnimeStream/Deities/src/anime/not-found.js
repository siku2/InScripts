function _animeNotFoundMsg() {
    const animeProvId = animeName.replace(/\W+/g, "")
        .toLowerCase();
    console.log(animeProvId);
    const cookieName = "already-warned-" + animeProvId;
    if (!Cookies.get(cookieName)) {
        let alertMsg = "Couldn't find \"" + animeName + "\"!";
        if (Raven.isSetup()) {
            alertMsg += " A report has been created for you and you can expect for this anime to be available soon";
            Raven.captureMessage("Anime \"" + animeName + "\" not found.", {
                level: "info"
            });
        }
        Cookies.set(cookieName, "true", {
            expires: 1
        });
        alert(alertMsg);
    } else {
        console.log("Already warned about missing anime");
    }
}
