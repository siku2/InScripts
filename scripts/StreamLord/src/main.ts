import { OverviewPage } from "./pages/overview";
import { EpisodePage } from "./pages/episode";
import { CommonPage } from "./pages/common";

const pages = [
    new CommonPage(),
    new OverviewPage(),
    new EpisodePage(),
];

const url = new URL(location.href);

for (const page of pages) {
    if (page.matches(url)) {
        page.onVisit();
    }
}