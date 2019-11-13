export class EpisodeInfo {
  constructor(
    public readonly season: number,
    public readonly number: number,
    public readonly name: string,
    public readonly link: string
  ) {}
}

export class SeriesInfo {
  private readonly seasons: {
    [season: number]: { [episode: number]: EpisodeInfo };
  };

  constructor(episodes: EpisodeInfo[]) {
    this.seasons = {};

    for (const ep of episodes) {
      let season = this.seasons[ep.season];
      if (!season) {
        season = this.seasons[ep.season] = {};
      }

      season[ep.number] = ep;
    }
  }

  public getSeason(season: number): EpisodeInfo[] {
    const eps = this.seasons[season];
    if (!eps) return [];

    return Object.values(eps);
  }

  public getEpisode(season: number, episode: number): EpisodeInfo | undefined {
    return this.seasons[season]?.[episode];
  }

  public getNextEpisode(
    season: number,
    episode: number
  ): EpisodeInfo | undefined {
    return (
      this.getEpisode(season, episode + 1) || this.getEpisode(season + 1, 1)
    );
  }

  public get allEpisodes(): EpisodeInfo[] {
    return Object.values(this.seasons).flatMap(eps => Object.values(eps));
  }
}

export function hasSeriesInfo(key: string): boolean {
  return Boolean(sessionStorage.getItem(key));
}

export function loadSeriesInfo(key: string): SeriesInfo | undefined {
  const raw = sessionStorage.getItem(key);
  if (!raw) return undefined;

  return new SeriesInfo(JSON.parse(raw));
}

export function saveSeriesInfo(key: string, info: SeriesInfo): void {
  const raw = JSON.stringify(info.allEpisodes);
  sessionStorage.setItem(key, raw);
}
