import { OverviewPage } from "./pages/overview";
import { EpisodePage } from "./pages/episode";

const pages = [
    new OverviewPage(),
    new EpisodePage(),
];

const url = new URL(location.href);

for (const page of pages) {
    if (page.matches(url)) {
        page.onVisit();
        break;
    }
}