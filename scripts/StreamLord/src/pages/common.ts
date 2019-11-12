import { Page } from "../page";
import { replaceClass } from "../utils";

export class CommonPage implements Page {
    styliseHeader() {
        replaceClass(document.querySelector("#logo")?.classList, "span_2", "span_8");
        replaceClass(document.querySelector("#menu")?.classList, "span_7", "span_4");

        document.querySelectorAll(".main-menu > li:not([id])")
            .forEach(el => el.remove());

        document.querySelector("#account-settings")?.remove();
        document.querySelector("#search-outer")?.remove();
    }

    matches(url: URL): boolean {
        return true;
    }

    onVisit(): void {
        this.styliseHeader();
    }
}