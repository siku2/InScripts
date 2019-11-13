export interface Page {
  matches(url: URL): boolean;
  onVisit(): void;
}
