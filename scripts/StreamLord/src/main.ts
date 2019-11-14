import { Page } from "./page";
import { CommonPage } from "./pages/common";
import { EpisodePage } from "./pages/episode";
import { OverviewPage } from "./pages/overview";

const pages: Page[] = [new CommonPage(), new OverviewPage(), new EpisodePage()];

const url = new URL(location.href);

for (const page of pages) {
  if (page.matches(url)) {
    try {
      page.onVisit();
    } catch (e) {
      console.exception(e);
      alert("Something went wrong: " + e);
    }
  }
}
