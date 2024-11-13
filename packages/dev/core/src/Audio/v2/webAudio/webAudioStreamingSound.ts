import { Tools } from "../../../Misc/tools";
import type { Nullable } from "../../../types";
import type { AbstractAudioEngine } from "../abstractAudioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { centsToPlaybackRate } from "../audioUtils";
import { SoundState } from "../soundState";
import type { IStreamingSoundOptions } from "../streamingSound";
import { StreamingSound } from "../streamingSound";
import { StreamingSoundInstance } from "../streamingSoundInstance";
import type { WebAudioBus } from "./webAudioBus";
import type { WebAudioEngine } from "./webAudioEngine";
import type { WebAudioMainBus } from "./webAudioMainBus";

export type StreamingSoundSourceType = HTMLMediaElement | string | string[];

/**
 * Creates a new streaming sound.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param engine - The audio engine.
 * @param options - The options for the streaming sound.
 * @returns A promise that resolves to the created streaming sound.
 */
export async function CreateStreamingSoundAsync(
    name: string,
    source: StreamingSoundSourceType,
    engine: AbstractAudioEngine,
    options: Nullable<IStreamingSoundOptions> = null
): Promise<StreamingSound> {
    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const sound = new WebAudioStreamingSound(name, engine as WebAudioEngine, options);
    await sound.init(source, options);
    (engine as WebAudioEngine).addSound(sound);
    return sound;
}

/** @internal */
class WebAudioStreamingSound extends StreamingSound {
    private _gainNode: GainNode;

    /** @internal */
    public source: StreamingSoundSourceType;

    /** @internal */
    public override readonly engine: WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    public get volume(): number {
        return this._gainNode.gain.value;
    }

    public set volume(value: number) {
        this._gainNode.gain.value = value;
    }

    /** @internal */
    public get webAudioInputNode() {
        return this._gainNode;
    }

    /** @internal */
    public get webAudioOutputNode() {
        return this._gainNode;
    }

    /** @internal */
    public get currentTime(): number {
        return 0;
    }

    /** @internal */
    constructor(name: string, engine: WebAudioEngine, options: Nullable<IStreamingSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(source: StreamingSoundSourceType, options: Nullable<IStreamingSoundOptions> = null): Promise<void> {
        const audioContext = await this.engine.audioContext;

        if (!(audioContext instanceof AudioContext)) {
            throw new Error("Unsupported audio context type.");
        }

        this.audioContext = audioContext;

        this._gainNode = new GainNode(this.audioContext);

        this.source = source;
        this.outputBus = options?.outputBus ?? this.engine.defaultMainBus;
        this.volume = options?.volume ?? 1;

        if (options?.autoplay) {
            await this.play(null, this.startOffset);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSound";
    }

    protected async _createSoundInstance(): Promise<WebAudioStreamingSoundInstance> {
        const soundInstance = new WebAudioStreamingSoundInstance(this);
        await soundInstance.init();
        this.engine.addSoundInstance(soundInstance);
        return soundInstance;
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node.getClassName() === "WebAudioMainBus" || node.getClassName() === "WebAudioBus") {
            this.webAudioOutputNode.connect((node as WebAudioMainBus | WebAudioBus).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node.getClassName() === "WebAudioMainBus" || node.getClassName() === "WebAudioBus") {
            this.webAudioOutputNode.disconnect((node as WebAudioMainBus | WebAudioBus).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}

/** @internal */
class WebAudioStreamingSoundInstance extends StreamingSoundInstance {
    private _waitTimer: Nullable<NodeJS.Timeout> = null;

    private _mediaElementPromise: Promise<HTMLMediaElement> = new Promise((resolve) => {
        this._resolveMediaElementPromise = resolve;
    });
    private _resolveMediaElementPromise: (mediaElement: HTMLMediaElement) => void;

    private _onCanPlayThrough: () => void = (() => {
        this._resolveMediaElementPromise(this.mediaElement);
    }).bind(this);

    protected override _source: WebAudioStreamingSound;

    /** @internal */
    public mediaElement: HTMLMediaElement;

    /** @internal */
    public sourceNode: Nullable<MediaElementAudioSourceNode>;

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this.mediaElement?.currentTime ?? 0;
    }

    constructor(source: WebAudioStreamingSound) {
        super(source);

        if (typeof source.source === "string") {
            this._initFromUrl(source.source);
        } else if (Array.isArray(source.source)) {
            this._initFromUrls(source.source);
        } else if (source.source instanceof HTMLMediaElement) {
            this._initFromMediaElement(source.source);
        }
    }

    public async init(): Promise<void> {
        await this._mediaElementPromise;
    }

    private _initFromUrl(url: string): void {
        const audio = new Audio(url);
        this._initFromMediaElement(audio);
    }

    private _initFromUrls(urls: string[]): void {
        const audio = new Audio();

        for (const url of urls) {
            const source = document.createElement("source");
            source.src = url;
            audio.appendChild(source);
        }

        this._initFromMediaElement(audio);
    }

    private _initFromMediaElement(mediaElement: HTMLMediaElement): void {
        Tools.SetCorsBehavior(mediaElement.currentSrc, mediaElement);

        mediaElement.controls = false;
        mediaElement.loop = this._source.loop;
        mediaElement.preload = this._source.preload;
        mediaElement.preservesPitch = this._source.preservesPitch;

        mediaElement.addEventListener("canplaythrough", this._onCanPlayThrough, { once: true });
        mediaElement.addEventListener("ended", this._onEnded);

        mediaElement.load();

        // NB: `HTMLAudioElement.load()` sets `playbackRate` to 1, so we set it after calling `load()`.
        mediaElement.playbackRate = this._source.playbackRate * centsToPlaybackRate(this._source.pitch);

        document.body.appendChild(mediaElement);

        this.sourceNode = new MediaElementAudioSourceNode(this._source.audioContext, { mediaElement: mediaElement });
        this._connect(this._source);

        this.mediaElement = mediaElement;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._clearWaitTimer();

        if (this.mediaElement) {
            this.mediaElement?.removeEventListener("ended", this._onEnded);
            this.mediaElement?.remove();
        }

        this.sourceNode = null;
    }

    /** @internal */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null): void {
        if (this._state === SoundState.Playing) {
            return;
        }

        if (startOffset && startOffset > 0) {
            if (this.mediaElement) {
                this.mediaElement.currentTime = startOffset;
            }
        }

        this._clearWaitTimer();

        if (waitTime && waitTime > 0) {
            this._waitTimer = setTimeout(() => {
                this._waitTimer = null;
                this._state = SoundState.Playing;
                this.mediaElement.play();
            }, waitTime * 1000);
        } else {
            this._state = SoundState.Playing;
            this.mediaElement.play();
        }
    }

    /** @internal */
    public pause(): void {
        if (this._state !== SoundState.Playing) {
            return;
        }

        this._state = SoundState.Paused;

        this.mediaElement?.pause();
    }

    /** @internal */
    public resume(): void {
        if (this._state === SoundState.Paused) {
            this.play();
        }
    }

    /** @internal */
    public override stop(waitTime: Nullable<number> = null): void {
        if (this._state === SoundState.Stopped) {
            return;
        }

        this._clearWaitTimer();

        if (waitTime && waitTime > 0) {
            this._waitTimer = setTimeout(() => {
                this._waitTimer = null;
                this._state = SoundState.Stopped;
                this._stop();
            }, waitTime * 1000);
        } else {
            this._state = SoundState.Stopped;
            this._stop();
        }
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSoundInstance";
    }

    protected _onEnded = (() => {
        this.onEndedObservable.notifyObservers(this);
        this.dispose();
    }).bind(this);

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStreamingSound && node.webAudioInputNode) {
            this.sourceNode?.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStreamingSound && node.webAudioInputNode) {
            this.sourceNode?.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    private _stop(): void {
        this.mediaElement?.pause();
        this._onEnded();
    }

    private _clearWaitTimer(): void {
        if (this._waitTimer) {
            clearTimeout(this._waitTimer);
            this._waitTimer = null;
        }
    }
}
