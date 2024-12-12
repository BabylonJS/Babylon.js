import { Tools } from "../../../Misc/tools";
import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import { LastCreatedAudioEngine, type AudioEngineV2 } from "../audioEngineV2";
import { SoundState } from "../soundState";
import { _cleanUrl } from "../soundTools";
import type { IStreamingSoundOptions } from "../streamingSound";
import { StreamingSound } from "../streamingSound";
import { _StreamingSoundInstance } from "../streamingSoundInstance";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioNode } from "./webAudioNode";

export type StreamingSoundSourceType = HTMLMediaElement | string | string[];

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
class WebAudioStreamingSound extends StreamingSound implements IWebAudioNode {
    private _gainNode: GainNode;

    /** @internal */
    public source: StreamingSoundSourceType;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    public get stereoPan(): number {
        return 0;
    }

    /** @internal */
    public set stereoPan(value: number) {
        //
    }

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

        if (options?.preloadCount) {
            await this.preloadInstances(options.preloadCount);
        }

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

    protected override _onComponentAdded(component: AbstractAudioSubNode): void {
        //
    }

    protected override _onComponentRemoved(component: AbstractAudioSubNode): void {
        //
    }

    protected override _connect(node: IWebAudioNode): void {
        super._connect(node);
        this.webAudioOutputNode.connect(node.webAudioInputNode);
    }

    protected override _disconnect(node: IWebAudioNode): void {
        super._disconnect(node);
        this.webAudioOutputNode.disconnect(node.webAudioInputNode);
    }
}

/** @internal */
class WebAudioStreamingSoundInstance extends _StreamingSoundInstance {
    /** @internal */
    public override readonly engine: _WebAudioEngine;

    private _loop: boolean = false;
    private _preloadType: "" | "none" | "metadata" | "auto" = "auto";

    private _isReady: boolean = false;

    private _isReadyPromise: Promise<HTMLMediaElement> = new Promise((resolve) => {
        this._resolveIsReadyPromise = resolve;
    });
    private _resolveIsReadyPromise: (mediaElement: HTMLMediaElement) => void;

    private _onCanPlayThrough: () => void = () => {
        this._isReady = true;
        this._resolveIsReadyPromise(this.mediaElement);
        this.onReadyObservable.notifyObservers(this);
    };

    private _onEnded: () => void = () => {
        this.onEndedObservable.notifyObservers(this);
        this.dispose();
    };

    protected override _source: WebAudioStreamingSound;

    /** @internal */
    public mediaElement: HTMLMediaElement;

    /** @internal */
    public sourceNode: Nullable<MediaElementAudioSourceNode>;

    private _enginePlayTime: number = Infinity;
    private _enginePauseTime: number = 0;

    private _currentTimeChangedWhilePaused = false;

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._enginePlayTime;
        return this._enginePauseTime + timeSinceLastStart + this._startOffset;
    }

    set currentTime(value: number) {
        const restart = this._state === SoundState.Starting || this._state === SoundState.Started;

        if (restart) {
            this.mediaElement.pause();
            this._setState(SoundState.Stopped);
        }

        this._startOffset = value;

        if (restart) {
            this.play();
        } else if (this._state === SoundState.Paused) {
            this._currentTimeChangedWhilePaused = true;
        }
    }

    /** @internal */
    get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._enginePlayTime;
    }

    private _onEngineStateChanged = () => {
        if (this.engine.state !== "running") {
            return;
        }

        if (this._loop && this.state === SoundState.Starting) {
            this.play(this._startOffset);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    };

    constructor(source: WebAudioStreamingSound) {
        super(source);

        this._loop = source.loop;
        this._preloadType = source.preloadType;

        if (typeof source.source === "string") {
            this._initFromUrl(source.source);
        } else if (Array.isArray(source.source)) {
            this._initFromUrls(source.source);
        } else if (source.source instanceof HTMLMediaElement) {
            this._initFromMediaElement(source.source);
        }
    }

    private _initFromUrl(url: string): void {
        // TODO: Maybe use the existing file loading tools to clean the URL.
        const audio = new Audio(_cleanUrl(url));
        this._initFromMediaElement(audio);
    }

    private _initFromUrls(urls: string[]): void {
        const audio = new Audio();

        for (const url of urls) {
            const source = document.createElement("source");
            // TODO: Maybe use the existing file loading tools to clean the URL.
            source.src = _cleanUrl(url);
            audio.appendChild(source);
        }

        this._initFromMediaElement(audio);
    }

    private _initFromMediaElement(mediaElement: HTMLMediaElement): void {
        Tools.SetCorsBehavior(mediaElement.currentSrc, mediaElement);

        mediaElement.controls = false;
        mediaElement.loop = this._loop;
        mediaElement.preload = this._preloadType;

        mediaElement.addEventListener("canplaythrough", this._onCanPlayThrough, { once: true });
        mediaElement.addEventListener("ended", this._onEnded, { once: true });

        mediaElement.load();

        this.sourceNode = new MediaElementAudioSourceNode(this._source.audioContext, { mediaElement: mediaElement });
        this._connect(this._source);

        this.mediaElement = mediaElement;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this.sourceNode = null;

        this.mediaElement.removeEventListener("ended", this._onEnded);
        this.mediaElement.removeEventListener("canplaythrough", this._onCanPlayThrough);
        for (const child of Array.from(this.mediaElement.children)) {
            this.mediaElement.removeChild(child);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    /** @internal */
    public play(startOffset: Nullable<number> = null): void {
        if (this._state === SoundState.Started) {
            return;
        }

        if (this._currentTimeChangedWhilePaused) {
            startOffset = this._startOffset;
            this._currentTimeChangedWhilePaused = false;
        } else if (this._state === SoundState.Paused) {
            startOffset = this.currentTime + this._startOffset;
        } else if (startOffset) {
            this._startOffset = startOffset;
        } else {
            startOffset = this._startOffset;
        }

        if (startOffset && startOffset > 0) {
            this.mediaElement.currentTime = startOffset;
        }

        this._play();
    }

    /** @internal */
    public pause(): void {
        if (this._state !== SoundState.Starting && this._state !== SoundState.Started) {
            return;
        }

        this._setState(SoundState.Paused);
        this._enginePauseTime += this.engine.currentTime - this._enginePlayTime;

        this.mediaElement.pause();
    }

    /** @internal */
    public resume(): void {
        if (this._state === SoundState.Paused) {
            this.play();
        } else if (this._currentTimeChangedWhilePaused) {
            this.play(this._startOffset);
        }
    }

    /** @internal */
    public override stop(): void {
        if (this._state === SoundState.Stopped) {
            return;
        }

        this._stop();
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSoundInstance";
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStreamingSound && node.webAudioInputNode) {
            this.sourceNode?.connect(node.webAudioInputNode);
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStreamingSound && node.webAudioInputNode) {
            this.sourceNode?.disconnect(node.webAudioInputNode);
        }
    }

    private _play(): void {
        this._setState(SoundState.Starting);

        if (!this._isReady) {
            this._playAsync();
            return;
        }

        if (this._state !== SoundState.Starting) {
            return;
        }

        if (this.engine.state === "running") {
            const result = this.mediaElement.play();

            this._enginePlayTime = this.engine.currentTime;
            this._setState(SoundState.Started);

            // It's possible that the play() method fails on Safari, even if the audio engine's state is "running".
            // This occurs when the audio context is paused by the system (e.g. when the Vision Pro exits and enters
            // immersive mode), and resumed automatically by the audio engine without a user interaction.
            result.catch(() => {
                this._setState(SoundState.FailedToStart);

                if (this._loop) {
                    this.engine.startSoundInstanceOnNextUserInteraction(this);
                }
            });
        } else if (this._loop) {
            this.engine.stateChangedObservable.add(this._onEngineStateChanged);
        } else {
            this.stop();
            this._setState(SoundState.FailedToStart);
        }
    }

    private async _playAsync(): Promise<void> {
        await this._isReadyPromise;
        this._play();
    }

    private _stop(): void {
        this.mediaElement.pause();
        this._setState(SoundState.Stopped);
        this._onEnded();
        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }
}
