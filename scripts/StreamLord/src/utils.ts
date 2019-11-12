

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