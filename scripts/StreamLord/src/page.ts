export interface Page {
    matches(url: URL): boolean;
    getSeriesKey(): string | undefined;
    onVisit(): void;
}