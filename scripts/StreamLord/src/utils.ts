export async function querySelectorWait(selector: string, parentSelector?: string): Promise<Element> {
    let parent: ParentNode & Node;
    if (parentSelector) {
        const p = document.querySelector(parentSelector);
        if (!p) throw new Error("parent not found");

        parent = p;
    } else {
        parent = document;
    }


    return await new Promise(res => {
        const observer = new MutationObserver(() => {
            const el = parent.querySelector(selector);
            if (!el) return;

            res(el);
            observer.disconnect();
        });

        observer.observe(parent, {
            childList: true,
            subtree: true,
        });
    });
}

export function replaceClass(cl: DOMTokenList | undefined, c1: string, c2: string): void {
    if (!cl) return;
    cl.remove(c1);
    cl.add(c2);
}

export function injectStyle(css: string): void {
    const el = document.createElement("style");
    el.innerHTML = css;
    document.body.append(el);
}

export function htmlToElement(html: string): Node | undefined {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstChild || undefined;
}