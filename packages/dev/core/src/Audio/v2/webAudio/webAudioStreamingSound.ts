import { Tools } from "../../../Misc/tools";
import type { Nullable } from "../../../types";
import { LastCreatedAudioEngine, type AudioEngineV2 } from "../audioEngineV2";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { SoundState } from "../soundState";
import type { IStreamingSoundOptions } from "../streamingSound";
import { StreamingSound } from "../streamingSound";
import { StreamingSoundInstance } from "../streamingSoundInstance";
import type { _WebAudioBus } from "./webAudioBus";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { _WebAudioMainBus } from "./webAudioMainBus";

type StreamingSoundSourceType = HTMLMediaElement | string | string[];

/**
 * Creates a new streaming sound.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param options - The options for the streaming sound.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created streaming sound.
 */
export async function CreateStreamingSoundAsync(
    name: string,
    source: HTMLMediaElement | string | string[],
    options: Nullable<IStreamingSoundOptions> = null,
    engine: Nullable<AudioEngineV2> = null
): Promise<StreamingSound> {
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine available.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const sound = new WebAudioStreamingSound(name, engine as _WebAudioEngine, options);
    await sound.init(source, options);
    (engine as _WebAudioEngine).addSound(sound);
    return sound;
}

/** @internal */
class WebAudioStreamingSound extends StreamingSound {
    private _gainNode: GainNode;

    /** @internal */
    public source: StreamingSoundSourceType;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

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
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IStreamingSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(source: StreamingSoundSourceType, options: Nullable<IStreamingSoundOptions> = null): Promise<void> {
        const audioContext = this.engine.audioContext;

        if (!(audioContext instanceof AudioContext)) {
            throw new Error("Unsupported audio context type.");
        }

        this.audioContext = audioContext;

        this._gainNode = new GainNode(this.audioContext);

        this.source = source;

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        } else {
            await this.engine.isReadyPromise;
            this.outputBus = this.engine.defaultMainBus;
        }

        this.volume = options?.volume ?? 1;

        await new Promise<void>((resolve) => {
            const timer = setInterval(() => {
                if (document.body) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });

        if (options?.autoplay) {
            this.play(null, this.startOffset);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSound";
    }

    protected _createSoundInstance(): WebAudioStreamingSoundInstance {
        const soundInstance = new WebAudioStreamingSoundInstance(this);
        this.engine.addSoundInstance(soundInstance);
        return soundInstance;
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node.getClassName() === "_WebAudioMainBus" || node.getClassName() === "_WebAudioBus") {
            this.webAudioOutputNode.connect((node as _WebAudioMainBus | _WebAudioBus).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node.getClassName() === "_WebAudioMainBus" || node.getClassName() === "_WebAudioBus") {
            this.webAudioOutputNode.disconnect((node as _WebAudioMainBus | _WebAudioBus).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}

/** @internal */
class WebAudioStreamingSoundInstance extends StreamingSoundInstance {
    /** @internal */
    public override readonly engine: _WebAudioEngine;

    private _loop: boolean = false;
    private _preload: "" | "none" | "metadata" | "auto" = "auto";

    private _waitTimer: Nullable<NodeJS.Timeout> = null;

    private _isReadyPromise: Promise<HTMLMediaElement> = new Promise((resolve) => {
        this._resolveIsReadyPromise = resolve;
    });
    private _resolveIsReadyPromise: (mediaElement: HTMLMediaElement) => void;

    private _onCanPlayThrough: () => void = (() => {
        this._resolveIsReadyPromise(this.mediaElement);
        this.onReadyObservable.notifyObservers(this);
    }).bind(this);

    private _onEnded: () => void = (() => {
        this.onEndedObservable.notifyObservers(this);
        this.dispose();
    }).bind(this);

    protected override _source: WebAudioStreamingSound;

    /** @internal */
    public mediaElement: HTMLMediaElement;

    /** @internal */
    public sourceNode: Nullable<MediaElementAudioSourceNode>;

    private _currentTime: number = 0;
    private _startTime: number = Infinity;

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._startTime;
        return this._currentTime + timeSinceLastStart;
    }

    /** @internal */
    get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._startTime;
    }

    private _onEngineStateChanged = () => {
        if (this.engine.state !== "running") {
            return;
        }

        if (this._loop && this.state === SoundState.Starting) {
            this.play(this._startTime, this._startOffset);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    };

    constructor(source: WebAudioStreamingSound) {
        super(source);

        this._loop = source.loop;
        this._preload = source.preload;

        if (typeof source.source === "string") {
            this._initFromUrl(source.source);
        } else if (Array.isArray(source.source)) {
            this._initFromUrls(source.source);
        } else if (source.source instanceof HTMLMediaElement) {
            this._initFromMediaElement(source.source);
        }
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
        mediaElement.loop = this._loop;
        mediaElement.preload = this._preload;

        mediaElement.addEventListener("canplaythrough", this._onCanPlayThrough, { once: true });
        mediaElement.addEventListener("ended", this._onEnded, { once: true });

        mediaElement.load();

        document.body.appendChild(mediaElement);

        this.sourceNode = new MediaElementAudioSourceNode(this._source.audioContext, { mediaElement: mediaElement });
        this._connect(this._source);

        this.mediaElement = mediaElement;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();
        this._clearWaitTimer();

        this.sourceNode = null;

        if (document.body.contains(this.mediaElement)) {
            document.body.removeChild(this.mediaElement);
        }

        this.mediaElement.removeEventListener("ended", this._onEnded);
        this.mediaElement.removeEventListener("canplaythrough", this._onCanPlayThrough);
        for (const child of Array.from(this.mediaElement.children)) {
            this.mediaElement.removeChild(child);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    /** @internal */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null): void {
        if (this._state === SoundState.Started) {
            return;
        }

        if (this._state === SoundState.Paused) {
            startOffset = this.currentTime + this._startOffset;
            waitTime = 0;
        } else if (startOffset) {
            this._startOffset = startOffset;
        } else {
            startOffset = this._startOffset;
        }

        if (startOffset && startOffset > 0) {
            this.mediaElement.currentTime = startOffset;
        }

        this._clearWaitTimer();

        if (waitTime && waitTime > 0) {
            this._waitTimer = setTimeout(() => {
                this._waitTimer = null;
                this._setState(SoundState.Starting);
                this._play();
            }, waitTime * 1000);
        } else {
            this._setState(SoundState.Starting);
            this._play();
        }
    }

    /** @internal */
    public pause(): void {
        if (this._state !== SoundState.Starting && this._state !== SoundState.Started) {
            return;
        }

        this._setState(SoundState.Paused);
        this._currentTime += this.engine.currentTime - this._startTime;

        this.mediaElement.pause();
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
                this._stop();
            }, waitTime * 1000);
        } else {
            this._stop();
        }
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSoundInstance";
    }

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

    private async _play(): Promise<void> {
        await this._isReadyPromise;

        if (this._state !== SoundState.Starting) {
            return;
        }

        if (this.engine.state === "running") {
            this.mediaElement.play();
            this._startTime = this._source.audioContext.currentTime;
            this._setState(SoundState.Started);
        } else if (this._loop) {
            this.engine.stateChangedObservable.add(this._onEngineStateChanged);
        }
    }

    private _stop(): void {
        this.mediaElement.pause();
        this._setState(SoundState.Stopped);
        this._onEnded();
        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    private _clearWaitTimer(): void {
        if (this._waitTimer) {
            clearTimeout(this._waitTimer);
            this._waitTimer = null;
        }
    }
}
