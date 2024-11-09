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

/**
 * Options for creating a new WebAudioStreamingSound.
 */
export interface IWebAudioStreamingSoundOptions extends IStreamingSoundOptions {
    /**
     * The URL of the sound source.
     */
    source: string;
}

/**
 * Creates a new streaming sound.
 * @param name - The name of the sound.
 * @param engine - The audio engine.
 * @param options - The options for the streaming sound.
 * @returns A promise that resolves to the created streaming sound.
 */
export async function CreateStreamingSoundAsync(name: string, engine: AbstractAudioEngine, options: Nullable<IWebAudioStreamingSoundOptions> = null): Promise<StreamingSound> {
    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const sound = new WebAudioStreamingSound(name, engine as WebAudioEngine, options);
    await sound.init(options);
    (engine as WebAudioEngine).addSound(sound);
    return sound;
}

/** @internal */
class WebAudioStreamingSound extends StreamingSound {
    private _gainNode: GainNode;

    /** @internal */
    public source: string;

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
    constructor(name: string, engine: WebAudioEngine, options: Nullable<IWebAudioStreamingSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioStreamingSoundOptions> = null): Promise<void> {
        const audioContext = await this.engine.audioContext;

        if (!(audioContext instanceof AudioContext)) {
            throw new Error("Unsupported audio context type.");
        }

        this.audioContext = audioContext;

        this._gainNode = new GainNode(this.audioContext);

        this.source = options?.source ?? "";
        this.outputBus = options?.outputBus ?? this.engine.defaultMainBus;
        this.volume = options?.volume ?? 1;

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
    private _isReady: boolean = false;

    private _onCanPlayThrough: () => void = (() => {
        this._isReady = true;

        if (this._state === SoundState.Playing) {
            this._play();
        }
    }).bind(this);

    protected override _source: WebAudioStreamingSound;

    /** @internal */
    public audioElement: Nullable<HTMLAudioElement>;

    /** @internal */
    public sourceNode: Nullable<MediaElementAudioSourceNode>;

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this.audioElement?.currentTime ?? 0;
    }

    constructor(source: WebAudioStreamingSound) {
        super(source);

        if (typeof source.source === "string") {
            this._initFromUrl(source.source);
        }
    }

    private _initFromUrl(url: string): void {
        const audio = new Audio(url);

        Tools.SetCorsBehavior(url, audio);

        audio.controls = false;
        audio.loop = this._source.loop;
        audio.preload = this._source.preload;
        audio.preservesPitch = this._source.preservesPitch;

        audio.addEventListener("canplaythrough", this._onCanPlayThrough, { once: true });
        audio.addEventListener("ended", this._onEnded);

        audio.load();

        // NB: `HTMLAudioElement.load()` sets `playbackRate` to 1, so we set it after calling `load()`.
        audio.playbackRate = this._source.playbackRate * centsToPlaybackRate(this._source.pitch);

        document.body.appendChild(audio);

        this.sourceNode = new MediaElementAudioSourceNode(this._source.audioContext, { mediaElement: audio });
        this._connect(this._source);

        this.audioElement = audio;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        if (this.audioElement) {
            this.audioElement?.removeEventListener("ended", this._onEnded);
            this.audioElement?.remove();
        }

        this.sourceNode = null;
    }

    /** @internal */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null): void {
        if (this._state === SoundState.Playing) {
            return;
        }

        this._state = SoundState.Playing;

        this._play();
    }

    /** @internal */
    public pause(): void {
        if (this._state === SoundState.Paused) {
            return;
        }

        this._state = SoundState.Paused;

        this.audioElement?.pause();
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

        this._state = SoundState.Stopped;

        this.audioElement?.pause();

        this._onEnded();
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

    private _play(): void {
        if (!this._isReady) {
            return;
        }

        if (this.audioElement) {
            this.audioElement.play();
        }
    }
}
