async function route() {
  const path = window.location.pathname;
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
    showAnimeEpsiodes();
  } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)) {
    showAnimeEpisode();
  }
}
