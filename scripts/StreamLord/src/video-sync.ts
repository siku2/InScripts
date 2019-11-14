import Peer from "peerjs";
import { AsyncQueue } from "./async-queue";

declare const unsafeWindow: { jwplayer: jwplayer.JWPlayerStatic };

type Msg = string | number;
type MsgHandler = (msg: Msg) => void;

function sanitizeID(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/[-_]+$/, "")
    .replace(/^[-_]+/, "");
}

function waitOpen(c: Peer | Peer.DataConnection): Promise<void> {
  return new Promise((resolve, reject) => {
    c.on("open", resolve);
    c.on("error", reject);
  });
}

type PeerConnTuple = [Peer, Peer.DataConnection];

async function createPeer(id?: string): Promise<Peer> {
  const peer = new Peer(id, { debug: 2 });
  await waitOpen(peer);

  return peer;
}

async function connectPeer(
  target: string,
  onMessage: MsgHandler
): Promise<PeerConnTuple> {
  const peer = await createPeer();

  const conn = peer.connect(target);
  conn.on("data", onMessage);

  await waitOpen(conn);

  return [peer, conn];
}

async function waitForConnection(
  id: string,
  onMessage: MsgHandler
): Promise<PeerConnTuple> {
  const peer = await createPeer(id);

  const conn: Peer.DataConnection = await new Promise(resolve =>
    peer.on("connection", resolve)
  );
  conn.on("data", onMessage);

  await waitOpen(conn);

  return [peer, conn];
}

async function getConnection(
  onMessage: MsgHandler
): Promise<[PeerConnTuple, boolean]> {
  const id = sanitizeID(location.pathname);
  console.debug("connecting to", id);

  let connTuple: PeerConnTuple;
  let isMaster: boolean;

  try {
    connTuple = await waitForConnection(id, onMessage);
    isMaster = true;
  } catch (error) {
    if (error.type !== "unavailable-id") {
      throw error;
    }

    connTuple = await connectPeer(id, onMessage);
    isMaster = false;
  }

  console.debug("connected", connTuple, "master:", isMaster);

  return [connTuple, isMaster];
}

function sleep(delay: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay));
}

function sleepUntil(d: number): Promise<void> {
  return sleep(d - Date.now());
}

export class VideoSync {
  private readonly videoEl: HTMLVideoElement;
  private readonly jwplayer: jwplayer.JWPlayer;
  private readonly btnEl: Element;

  private toggled: boolean;
  private hasTextProg: boolean;
  private readonly progressTextStack: string[];

  constructor(videoElement: HTMLVideoElement, buttonElement: Element) {
    this.videoEl = videoElement;
    this.jwplayer = unsafeWindow.jwplayer();
    this.btnEl = buttonElement;
    this.hasTextProg = false;

    this.toggled = false;
    this.progressTextStack = [];
  }

  public listen(): void {
    this.btnEl.addEventListener("click", () => this.toggleCountdown());
  }

  private addProgressText(s: string): () => void {
    if (!this.hasTextProg) {
      this.hasTextProg = true;
      this.btnEl.textContent = s;
    } else {
      this.progressTextStack.push(s);
    }

    return (): void => {
      const index = this.progressTextStack.indexOf(s);

      if (index === -1) {
        const nextText = this.progressTextStack.shift();
        if (!nextText) {
          this.hasTextProg = false;
        }

        this.btnEl.textContent = nextText || "done";
      } else {
        this.progressTextStack.splice(index, 1);
      }
    };
  }

  private async withProgressText<T>(
    text: string,
    callback: () => T
  ): Promise<T> {
    const done = this.addProgressText(text);

    try {
      return await Promise.resolve(callback());
    } finally {
      done();
    }
  }

  private async waitVideoLoaded(): Promise<void> {
    switch (this.jwplayer.getState()) {
      case "IDLE":
        this.jwplayer.play();
      // fall through
      case "BUFFERING":
        await new Promise(resolve => {
          return this.videoEl.addEventListener("play", resolve, { once: true });
        });
      // fall through
      case "PLAYING":
        this.jwplayer.pause();
        break;
    }
  }

  private async showCountdownTo(d: number): Promise<void> {
    for (;;) {
      const diff = d - Date.now();
      if (diff <= 0) break;

      this.btnEl.textContent = (Math.floor(diff / 1000) + 1).toString();
      await sleep(diff % 1000 || 1000);
    }

    this.btnEl.textContent = "Started";
  }

  private async startCountdown(): Promise<void> {
    this.toggled = true;
    this.hasTextProg = false;
    this.btnEl.classList.add("active");

    const videoLoadedPromise = this.withProgressText("loading video", () =>
      this.waitVideoLoaded()
    );

    const messageQueue = new AsyncQueue<Msg>();
    const [[peer, conn], isMaster] = await this.withProgressText(
      "establishing connection",
      () =>
        getConnection(message => {
          console.debug("received", message);
          messageQueue.put(message);
        })
    );

    try {
      await videoLoadedPromise;
      console.debug("video done");

      conn.send("READY");
      await this.withProgressText("waiting for remote to finish loading", () =>
        messageQueue.get()
      );

      console.debug("remote done");

      let startTime: number;
      if (isMaster) {
        startTime = Date.now() + 3000;
        conn.send(startTime);

        console.debug("waiting for acknowledgement");
        await messageQueue.get();
      } else {
        startTime = await this.withProgressText(
          "waiting for start time",
          () => messageQueue.get() as Promise<number>
        );

        conn.send("ACK");
      }

      console.debug("sleeping for", startTime - Date.now(), "ms");
      this.showCountdownTo(startTime);
      await sleepUntil(startTime);

      this.startVideo();
    } finally {
      console.debug("destroying peer", peer);
      peer.destroy();
    }
  }

  private stopCountdown(): void {
    // This.toggled = false;
    // this.btnEl.classList.remove("active");
  }

  private startVideo(): void {
    this.jwplayer.seek(0);
  }

  public toggleCountdown(): void {
    if (this.toggled) {
      this.stopCountdown();
    } else {
      this.startCountdown();
    }
  }
}
