import Peer from "peerjs";
import { AsyncQueue } from "./async-queue";

function sanitizeID(id: string): string {
    id = id.replace(/[^a-zA-Z0-9-_]+/g, "-");

    id = id.replace(/[-_]+$/, "");
    id = id.replace(/^[-_]+/, "");

    return id;
}

function waitOpen(c: Peer | Peer.DataConnection): Promise<void> {
    return new Promise((res, rej) => {
        c.on("open", res);
        c.on("error", rej);
    });
}

type PeerConnTuple = [Peer, Peer.DataConnection];

async function createPeer(id?: string): Promise<Peer> {
    const peer = new Peer(id, { debug: 2 });
    await waitOpen(peer);
    return peer;
}

async function connectPeer(target: string, onMsg: (msg: any) => any): Promise<PeerConnTuple> {
    const peer = await createPeer();

    const conn = peer.connect(target);
    conn.on("data", onMsg);

    await waitOpen(conn);
    return [peer, conn];
}

async function waitForConnection(id: string, onMsg: (msg: any) => any): Promise<PeerConnTuple> {
    const peer = await createPeer(id);

    const conn: Peer.DataConnection = await new Promise(res => {
        peer.on("connection", res);
    });
    conn.on("data", onMsg);

    await waitOpen(conn);
    return [peer, conn];
}

function sleep(delay: number): Promise<void> {
    return new Promise(res => setTimeout(res, delay));
}

function sleepUntil(d: number): Promise<void> {
    return sleep(d - Date.now());
}

export class VideoSync {
    private readonly videoEl: HTMLVideoElement;
    private readonly jwplayer: any;
    private readonly btnEl: HTMLElement;

    private toggled: boolean;

    private hasTextProg: boolean;
    private readonly progressTextStack: string[];


    constructor(videoEl: HTMLVideoElement, btnEl: HTMLElement) {
        this.videoEl = videoEl;
        this.jwplayer = window["unsafeWindow"].jwplayer();
        this.btnEl = btnEl;
        this.hasTextProg = false;

        this.toggled = false;
        this.progressTextStack = [];
    }

    public listen() {
        this.btnEl.addEventListener("click", () => this.toggleCountdown());
    }

    private addProgressText(s: string): () => any {
        if (!this.hasTextProg) {
            this.hasTextProg = true;
            this.btnEl.textContent = s;
        } else {
            this.progressTextStack.push(s);
        }

        return () => {
            const index = this.progressTextStack.indexOf(s);

            if (index == -1) {
                const nextText = this.progressTextStack.shift();
                if (!nextText) this.hasTextProg = false;

                this.btnEl.textContent = nextText || "done";
            } else {
                this.progressTextStack.splice(index, 1);
            }
        };
    }

    private async withProgressText<T>(text: string, cb: () => T): Promise<T> {
        const done = this.addProgressText(text);

        try {
            return await Promise.resolve(cb());
        } finally {
            done();
        }
    }

    private async waitVideoLoaded() {
        switch (this.jwplayer.getState()) {
            case "IDLE":
                this.jwplayer.play();
            case "BUFFERING":
                await new Promise(res => this.videoEl.addEventListener("play", res, { once: true }));
                this.jwplayer.pause();
                break;
        }
    }

    private async getConnection(onMsg: (msg: any) => any): Promise<[PeerConnTuple, boolean]> {
        const id = sanitizeID(location.href);
        console.debug("connecting to", id);

        let connTuple: PeerConnTuple
        let isMaster: boolean;

        try {
            connTuple = await waitForConnection(id, onMsg);
            isMaster = true;
        } catch (e) {
            if (e.type != "unavailable-id") throw e;

            connTuple = await connectPeer(id, onMsg);
            isMaster = false;
        }

        console.debug("connected", connTuple, "master:", isMaster);

        return [connTuple, isMaster];
    }

    private async showCountdownTo(d: number) {
        while (true) {
            const diff = d - Date.now();
            if (diff <= 0) break;

            this.btnEl.textContent = (Math.floor(diff / 1000) + 1).toString();
            await sleep((diff % 1000) || 1000);
        }

        this.btnEl.textContent = "Autostarted";
    }

    private async startCountdown() {
        this.toggled = true;
        this.hasTextProg = false;
        this.btnEl.classList.add("active");

        const videoLoadedPromise = this.withProgressText("loading video",
            () => this.waitVideoLoaded());

        const msgQueue = new AsyncQueue<any>();
        const [[peer, conn], isMaster] = await this.withProgressText(
            "establishing connection",
            () => this.getConnection(msg => {
                console.debug("received", msg);
                msgQueue.put(msg);
            })
        );

        try {
            await videoLoadedPromise;
            console.debug("video done");

            conn.send("READY");
            await this.withProgressText("waiting for remote to finish loading",
                () => msgQueue.get());

            console.debug("remote done");

            let startTime: number;
            if (isMaster) {
                startTime = Date.now() + 3000;
                conn.send(startTime);

                console.debug("waiting for acknowledgement");
                await msgQueue.get();
            } else {
                startTime = await this.withProgressText("waiting for start time",
                    () => msgQueue.get());

                conn.send("ACK");
            }

            console.debug("sleeping until", startTime, "delta:", startTime - Date.now(), "ms");
            this.showCountdownTo(startTime);
            await sleepUntil(startTime);

            this.startVideo();
        } finally {
            console.debug("destroying peer", peer);
            peer.destroy();
        }
    }

    private stopCountdown() {
        // this.toggled = false;
        // this.btnEl.classList.remove("active");
    }

    private startVideo() {
        this.jwplayer.seek(0);
    }

    public toggleCountdown() {
        if (this.toggled) this.stopCountdown();
        else this.startCountdown();
    }
}