const settingPaths = ["/editprofile.php", "/notification/setting", "/ownlist/style", "/account/payment"];

async function route() {
    const path = window.location.pathname;
    const params = window.location.search;

    if (settingPaths.indexOf(path) > -1) {
        addSettingsButton();
    }

    if (path.match(/^\/anime\/\d+\/[\w-]+\/?/)) {
        patchNoEpisodeTab();
        const foundAnimeInfo = await getAnimeInfo();
        if (!foundAnimeInfo) {
            _animeNotFoundMsg();
            return;
        }
    }

    if (path.match(/^\/anime\/\d+\/[\w-]+\/?$/)) {
        showAnimeDetails();
    } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/?$/)) {
        await showAnimeEpsiodes();
    } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)) {
        await showAnimeEpisode();
    } else if (path.match(/^\/animelist\/\w+$/)) {
        await highlightAnimeWithUnwatchedEpisodes();
    } else if (path.match(/^\/editprofile\.php$/) && params.match(/^\?go=myanimestream$/)) {
        await showSettings();
    }
}
