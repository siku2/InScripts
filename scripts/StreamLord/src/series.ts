export class EpisodeInfo {
    constructor(
        public readonly season: number,
        public readonly number: number,
        public readonly name: string,
        public readonly link: string,
    ) { }
}

export class SeriesInfo {
    constructor(private readonly episodes: EpisodeInfo[]) {
    }

    public getSeason(season: number): EpisodeInfo[] {
        return this.episodes.filter(ep => ep.season === season);
    }

    public getEpisode(season: number, episode: number): EpisodeInfo | undefined {
        return this.episodes.find(ep => ep.season === season && ep.number == episode);
    }

    public getNextEpisode(season: number, episode: number): EpisodeInfo | undefined {
        return this.getEpisode(season, episode + 1) || this.getEpisode(season + 1, 1);
    }

    public get allEpisodes(): EpisodeInfo[] {
        return this.episodes;
    }
}

export function hasSeriesInfo(key: string): boolean {
    return !!sessionStorage.getItem(key);
}

export function loadSeriesInfo(key: string): SeriesInfo | undefined {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;

    return new SeriesInfo(JSON.parse(raw));
}

export function saveSeriesInfo(key: string, info: SeriesInfo) {
    const raw = JSON.stringify(info.allEpisodes);
    sessionStorage.setItem(key, raw);
}