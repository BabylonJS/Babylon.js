import { Tools } from "../../../Misc/tools";
import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { SoundState } from "../soundState";
import { _cleanUrl } from "../soundTools";
import type { IStreamingSoundOptions } from "../streamingSound";
import { StreamingSound } from "../streamingSound";
import { _StreamingSoundInstance } from "../streamingSoundInstance";
import { _WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioOutNode, IWebAudioSuperNode } from "./webAudioNode";
import { _getWebAudioEngine } from "./webAudioTools";

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
    const webAudioEngine = _getWebAudioEngine(engine);

    const sound = new WebAudioStreamingSound(name, webAudioEngine, options);
    await sound.init(source, options);

    return sound;
}

/** @internal */
class WebAudioStreamingSound extends StreamingSound implements IWebAudioSuperNode {
    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public source: StreamingSoundSourceType;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Nullable<IStreamingSoundOptions> = null) {
        super(name, engine, options);

        this._subGraph = new WebAudioStreamingSound._SubGraph(this);
    }

    /** @internal */
    public async init(source: StreamingSoundSourceType, options: Nullable<IStreamingSoundOptions> = null): Promise<void> {
        const audioContext = this.engine.audioContext;

        if (!(audioContext instanceof AudioContext)) {
            throw new Error("Unsupported audio context type.");
        }

        this.audioContext = audioContext;
        this.source = source;

        if (options?.outBus) {
            this.outBus = options.outBus;
        } else {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.init(options);

        if (options?.preloadCount) {
            await this.preloadInstances(options.preloadCount);
        }

        if (options?.autoplay) {
            this.play(null, this.startOffset);
        }

        this.engine.addSuperNode(this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.engine.removeSuperNode(this);
    }

    /** @internal */
    public get inNode() {
        return this._subGraph.inNode;
    }

    /** @internal */
    public get outNode() {
        return this._subGraph.outNode;
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSound";
    }

    protected _createInstance(): WebAudioStreamingSoundInstance {
        return new WebAudioStreamingSoundInstance(this);
    }

    protected override _connect(node: IWebAudioInNode): void {
        super._connect(node);

        if (this._subGraph.inNode) {
            this.outNode?.connect(this._subGraph.inNode);
        }
    }

    protected override _disconnect(node: IWebAudioInNode): void {
        super._disconnect(node);

        if (this._subGraph.inNode) {
            this.outNode?.disconnect(this._subGraph.inNode);
        }
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: WebAudioStreamingSound;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }
    };
}

/** @internal */
class WebAudioStreamingSoundInstance extends _StreamingSoundInstance implements IWebAudioOutNode {
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

    protected override _sound: WebAudioStreamingSound;

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

    public constructor(sound: WebAudioStreamingSound) {
        super(sound);

        this._loop = sound.loop;
        this._preloadType = sound.preloadType;

        if (typeof sound.source === "string") {
            this._initFromUrl(sound.source);
        } else if (Array.isArray(sound.source)) {
            this._initFromUrls(sound.source);
        } else if (sound.source instanceof HTMLMediaElement) {
            this._initFromMediaElement(sound.source);
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

        this.sourceNode = new MediaElementAudioSourceNode(this._sound.audioContext, { mediaElement: mediaElement });
        this._connect(this._sound);

        this.mediaElement = mediaElement;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this.sourceNode = null;

        this.mediaElement.removeEventListener("ended", this._onEnded);
        this.mediaElement.removeEventListener("canplaythrough", this._onCanPlayThrough);
        for (const source of Array.from(this.mediaElement.children)) {
            this.mediaElement.removeChild(source);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    public get outNode(): Nullable<AudioNode> {
        return this.sourceNode;
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

        if (node instanceof WebAudioStreamingSound && node.inNode) {
            this.sourceNode?.connect(node.inNode);
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStreamingSound && node.inNode) {
            this.sourceNode?.disconnect(node.inNode);
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
