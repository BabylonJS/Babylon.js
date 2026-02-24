import { Logger } from "../../Misc/logger";
import { Tools } from "../../Misc/tools";
import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type {} from "../abstractAudio/abstractSound";
import type { IStreamingSoundOptions, IStreamingSoundPlayOptions, IStreamingSoundStoredOptions } from "../abstractAudio/streamingSound";
import { StreamingSound } from "../abstractAudio/streamingSound";
import { _StreamingSoundInstance } from "../abstractAudio/streamingSoundInstance";
import { _HasSpatialAudioOptions, type AbstractSpatialAudio } from "../abstractAudio/subProperties/abstractSpatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _CleanUrl } from "../audioUtils";
import { SoundState } from "../soundState";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioOutNode, IWebAudioSuperNode } from "./webAudioNode";

type StreamingSoundSourceType = HTMLMediaElement | string | string[];

/** @internal */
export class _WebAudioStreamingSound extends StreamingSound implements IWebAudioSuperNode {
    private _stereo: Nullable<_StereoAudio> = null;

    protected override readonly _options: IStreamingSoundStoredOptions;
    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public _audioContext: AudioContext;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public _source: StreamingSoundSourceType;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Partial<IStreamingSoundOptions>) {
        super(name, engine, options);

        this._options = {
            autoplay: options.autoplay ?? false,
            loop: options.loop ?? false,
            maxInstances: options.maxInstances ?? Infinity,
            preloadCount: options.preloadCount ?? 1,
            startOffset: options.startOffset ?? 0,
        };

        this._subGraph = new _WebAudioStreamingSound._SubGraph(this);
    }

    /** @internal */
    public async _initAsync(source: StreamingSoundSourceType, options: Partial<IStreamingSoundOptions>): Promise<void> {
        const audioContext = this.engine._audioContext;

        if (!(audioContext instanceof AudioContext)) {
            throw new Error("Unsupported audio context type.");
        }

        this._audioContext = audioContext;
        this._source = source;

        if (options.outBus) {
            this.outBus = options.outBus;
        } else if (options.outBusAutoDefault !== false) {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.initAsync(options);

        if (_HasSpatialAudioOptions(options)) {
            this._initSpatialProperty();
        }

        if (this.preloadCount) {
            await this.preloadInstancesAsync(this.preloadCount);
        }

        if (options.autoplay) {
            this.play(options);
        }

        this.engine._addSound(this);
    }

    /** @internal */
    public get _inNode() {
        return this._subGraph._inNode;
    }

    /** @internal */
    public get _outNode() {
        return this._subGraph._outNode;
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._stereo = null;

        this._subGraph.dispose();

        this.engine._removeSound(this);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioStreamingSound";
    }

    protected _createInstance(): _WebAudioStreamingSoundInstance {
        return new _WebAudioStreamingSoundInstance(this, this._options);
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node._inNode) {
            this._outNode?.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node._inNode) {
            this._outNode?.disconnect(node._inNode);
        }

        return true;
    }

    protected override _createSpatialProperty(autoUpdate: boolean, minUpdateTime: number): AbstractSpatialAudio {
        return new _SpatialWebAudio(this._subGraph, autoUpdate, minUpdateTime);
    }

    public _getOptions(): IStreamingSoundStoredOptions {
        return this._options;
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioStreamingSound;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }
    };
}

/** @internal */
class _WebAudioStreamingSoundInstance extends _StreamingSoundInstance implements IWebAudioOutNode {
    private _currentTimeChangedWhilePaused = false;
    private _enginePlayTime: number = Infinity;
    private _enginePauseTime: number = 0;
    private _isReady: boolean = false;
    private _isReadyPromise: Promise<HTMLMediaElement> = new Promise((resolve, reject) => {
        this._resolveIsReadyPromise = resolve;
        this._rejectIsReadyPromise = reject;
    });
    private _mediaElement: HTMLMediaElement;
    private _sourceNode: Nullable<MediaElementAudioSourceNode>;
    private _volumeNode: GainNode;

    protected override readonly _options: IStreamingSoundStoredOptions;
    protected override _sound: _WebAudioStreamingSound;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    public constructor(sound: _WebAudioStreamingSound, options: IStreamingSoundStoredOptions) {
        super(sound);

        this._options = options;
        this._volumeNode = new GainNode(sound._audioContext);

        if (typeof sound._source === "string") {
            this._initFromUrl(sound._source);
        } else if (Array.isArray(sound._source)) {
            this._initFromUrls(sound._source);
        } else if (sound._source instanceof HTMLMediaElement) {
            this._initFromMediaElement(sound._source);
        } else {
            throw new Error(`Invalid streaming sound source (${sound._source}).`);
        }
    }

    /** @internal */
    public get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._enginePlayTime;
        return this._enginePauseTime + timeSinceLastStart + this._options.startOffset;
    }

    public set currentTime(value: number) {
        const restart = this._state === SoundState.Starting || this._state === SoundState.Started;

        if (restart) {
            this._mediaElement.pause();
            this._state = SoundState.Stopped;
        }

        this._options.startOffset = value;

        if (restart) {
            this.play({ startOffset: value });
        } else if (this._state === SoundState.Paused) {
            this._currentTimeChangedWhilePaused = true;
        }
    }

    public get _outNode(): Nullable<AudioNode> {
        return this._volumeNode;
    }

    /** @internal */
    public get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._enginePlayTime;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._sourceNode?.disconnect(this._volumeNode);
        this._sourceNode = null;

        this._mediaElement.removeEventListener("error", this._onError);
        this._mediaElement.removeEventListener("ended", this._onEnded);
        this._mediaElement.removeEventListener("canplaythrough", this._onCanPlayThrough);

        for (const source of Array.from(this._mediaElement.children)) {
            this._mediaElement.removeChild(source);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
        this.engine.userGestureObservable.removeCallback(this._onUserGesture);
    }

    /** @internal */
    public play(options: Partial<IStreamingSoundPlayOptions> = {}): void {
        if (this._state === SoundState.Started) {
            return;
        }

        if (options.loop !== undefined) {
            this._options.loop = options.loop;
        }
        this._mediaElement.loop = this._options.loop;

        let startOffset = options.startOffset;

        if (this._currentTimeChangedWhilePaused) {
            startOffset = this._options.startOffset;
            this._currentTimeChangedWhilePaused = false;
        } else if (this._state === SoundState.Paused) {
            startOffset = this.currentTime;
        }

        if (startOffset && startOffset > 0) {
            this._mediaElement.currentTime = startOffset;
        }

        this._volumeNode.gain.value = options.volume ?? 1;

        this._play();
    }

    /** @internal */
    public pause(): void {
        if (this._state !== SoundState.Starting && this._state !== SoundState.Started) {
            return;
        }

        this._setState(SoundState.Paused);
        this._enginePauseTime += this.engine.currentTime - this._enginePlayTime;

        this._mediaElement.pause();
    }

    /** @internal */
    public resume(): void {
        if (this._state === SoundState.Paused) {
            this.play();
        } else if (this._currentTimeChangedWhilePaused) {
            this.play();
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
        return "_WebAudioStreamingSoundInstance";
    }

    protected override _connect(node: AbstractAudioNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the sound's subgraph.
        if (node instanceof _WebAudioStreamingSound && node._inNode) {
            this._outNode?.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: AbstractAudioNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node instanceof _WebAudioStreamingSound && node._inNode) {
            this._outNode?.disconnect(node._inNode);
        }

        return true;
    }

    private _initFromMediaElement(mediaElement: HTMLMediaElement): void {
        Tools.SetCorsBehavior(mediaElement.currentSrc, mediaElement);

        mediaElement.controls = false;
        mediaElement.loop = this._options.loop;
        mediaElement.preload = "auto";

        mediaElement.addEventListener("canplaythrough", this._onCanPlayThrough, { once: true });
        mediaElement.addEventListener("ended", this._onEnded, { once: true });
        mediaElement.addEventListener("error", this._onError, { once: true });

        mediaElement.load();

        this._sourceNode = new MediaElementAudioSourceNode(this._sound._audioContext, { mediaElement: mediaElement });
        this._sourceNode.connect(this._volumeNode);

        if (!this._connect(this._sound)) {
            throw new Error("Connect failed");
        }

        this._mediaElement = mediaElement;
    }

    private _initFromUrl(url: string): void {
        const audio = new Audio(_CleanUrl(url));
        this._initFromMediaElement(audio);
    }

    private _initFromUrls(urls: string[]): void {
        const audio = new Audio();

        for (const url of urls) {
            const source = document.createElement("source");
            source.src = _CleanUrl(url);
            audio.appendChild(source);
        }

        this._initFromMediaElement(audio);
    }

    private _onCanPlayThrough: () => void = () => {
        this._isReady = true;
        this._resolveIsReadyPromise(this._mediaElement);
        this.onReadyObservable.notifyObservers(this);
    };

    private _onEnded: () => void = () => {
        this._setState(SoundState.Stopped);
    };

    private _onError: (reason: any) => void = (reason: any) => {
        this._setState(SoundState.FailedToStart);
        this.onErrorObservable.notifyObservers(reason);
        this._rejectIsReadyPromise(reason);
        this.dispose();
    };

    private _onEngineStateChanged = () => {
        if (this.engine.state !== "running") {
            return;
        }

        if (this._options.loop && this.state === SoundState.Starting) {
            this.play();
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    };

    private _onUserGesture = () => {
        this.play();
    };

    private _play(): void {
        this._setState(SoundState.Starting);

        if (!this._isReady) {
            this._playWhenReady();
            return;
        }

        if (this._state !== SoundState.Starting) {
            return;
        }

        if (this.engine.state === "running") {
            const result = this._mediaElement.play();

            this._enginePlayTime = this.engine.currentTime;
            this._setState(SoundState.Started);

            // It's possible that the play() method fails on Safari, even if the audio engine's state is "running".
            // This occurs when the audio context is paused by the system and resumed automatically by the audio engine
            // without a user interaction (e.g. when the Vision Pro exits and reenters immersive mode).
            // eslint-disable-next-line github/no-then
            result.catch(() => {
                this._setState(SoundState.FailedToStart);

                if (this._options.loop) {
                    this.engine.userGestureObservable.addOnce(this._onUserGesture);
                }
            });
        } else if (this._options.loop) {
            this.engine.stateChangedObservable.add(this._onEngineStateChanged);
        } else {
            this.stop();
            this._setState(SoundState.FailedToStart);
        }
    }

    private _playWhenReady(): void {
        this._isReadyPromise
            // eslint-disable-next-line github/no-then
            .then(() => {
                this._play();
            })
            // eslint-disable-next-line github/no-then
            .catch(() => {
                Logger.Error("Streaming sound instance failed to play");
                this._setState(SoundState.FailedToStart);
            });
    }

    private _rejectIsReadyPromise: (reason?: any) => void;
    private _resolveIsReadyPromise: (mediaElement: HTMLMediaElement) => void;

    private _stop(): void {
        this._mediaElement.pause();
        this._onEnded();
        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }
}
