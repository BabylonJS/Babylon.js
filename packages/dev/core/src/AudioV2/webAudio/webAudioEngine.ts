import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { AbstractNamedAudioNode } from "../abstractAudio/abstractAudioNode";
import type { AudioBus, IAudioBusOptions } from "../abstractAudio/audioBus";
import type { AudioEngineV2State, IAudioEngineV2Options } from "../abstractAudio/audioEngineV2";
import { AudioEngineV2 } from "../abstractAudio/audioEngineV2";
import type { IMainAudioBusOptions, MainAudioBus } from "../abstractAudio/mainAudioBus";
import type { IStaticSoundOptions, StaticSound } from "../abstractAudio/staticSound";
import type { IStaticSoundBufferOptions, StaticSoundBuffer } from "../abstractAudio/staticSoundBuffer";
import type { IStreamingSoundOptions, StreamingSound } from "../abstractAudio/streamingSound";
import type { AbstractSpatialAudioListener } from "../abstractAudio/subProperties/abstractSpatialAudioListener";
import { _HasSpatialAudioListenerOptions } from "../abstractAudio/subProperties/abstractSpatialAudioListener";
import type { _SpatialAudioListener } from "../abstractAudio/subProperties/spatialAudioListener";
import { _CreateSpatialAudioListener } from "./subProperties/spatialWebAudioListener";
import { _WebAudioMainOut } from "./webAudioMainOut";
import { _WebAudioUnmuteUI } from "./webAudioUnmuteUI";

/**
 * Options for creating a v2 audio engine that uses the WebAudio API.
 */
export interface IWebAudioEngineOptions extends IAudioEngineV2Options {
    /**
     * The audio context to be used by the engine.
     */
    audioContext: AudioContext;
    /**
     * The default UI's parent element. Defaults to the last created graphics engine's canvas if it exists; otherwise the HTML document's body.
     */
    defaultUIParentElement?: HTMLElement;
    /**
     * Set to `true` to disable the default UI. Defaults to `false`.
     */
    disableDefaultUI?: boolean;
    /**
     * Set to `true` to automatically resume the audio context when the user interacts with the page. Defaults to `true`.
     */
    resumeOnInteraction: boolean;
    /**
     * Set to `true` to automatically resume the audio context when the browser pauses audio playback. Defaults to `true`.
     */
    resumeOnPause: boolean;
    /**
     * The interval in milliseconds to try resuming audio playback when `resumeOnPause` is `true`. Defaults to `1000`.
     */
    resumeOnPauseRetryInterval: number;
}

/**
 * Creates a new v2 audio engine that uses the WebAudio API.
 * @param options - The options for creating the audio engine.
 * @returns A promise that resolves with the created audio engine.
 */
export async function CreateAudioEngineAsync(options: Partial<IWebAudioEngineOptions> = {}): Promise<AudioEngineV2> {
    const engine = new _WebAudioEngine(options);
    await engine._init(options);
    return engine;
}

const FormatMimeTypes: { [key: string]: string } = {
    aac: "audio/aac",
    ac3: "audio/ac3",
    flac: "audio/flac",
    m4a: "audio/mp4",
    mp3: 'audio/mpeg; codecs="mp3"',
    mp4: "audio/mp4",
    ogg: 'audio/ogg; codecs="vorbis"',
    wav: "audio/wav",
    webm: 'audio/webm; codecs="vorbis"',
};

/** @internal */
export class _WebAudioEngine extends AudioEngineV2 {
    private _audioContextStarted = false;
    private _invalidFormats = new Set<string>();
    private _listener: Nullable<_SpatialAudioListener> = null;
    private _mainOut: _WebAudioMainOut;
    private _pauseCalled = false;
    private _resumeOnInteraction = true;
    private _resumeOnPause = true;
    private _resumeOnPauseRetryInterval = 1000;
    private _resumeOnPauseTimerId: any = null;
    private _resumePromise: Nullable<Promise<void>> = null;
    private readonly _listenerAutoUpdate: boolean = true;
    private readonly _listenerMinUpdateTime: number = 0;
    private _unmuteUI: Nullable<_WebAudioUnmuteUI> = null;
    private readonly _validFormats = new Set<string>();
    private _volume = 1;

    /** @internal */
    public readonly _audioContext: AudioContext;

    /** @internal */
    public readonly isReadyPromise: Promise<void> = new Promise((resolve) => {
        this._resolveIsReadyPromise = resolve;
    });

    /** @internal */
    public stateChangedObservable: Observable<string> = new Observable();

    /** @internal */
    public userGestureObservable: Observable<void> = new Observable();

    /** @internal */
    public constructor(options: Partial<IWebAudioEngineOptions> = {}) {
        super(options);

        if (typeof options.listenerAutoUpdate === "boolean") {
            this._listenerAutoUpdate = options.listenerAutoUpdate;
        }

        if (typeof options.listenerMinUpdateTime === "number") {
            this._listenerMinUpdateTime = options.listenerMinUpdateTime;
        }

        this._volume = options.volume ?? 1;
        this._audioContext = options.audioContext ?? new AudioContext();

        if (!options.disableDefaultUI) {
            this._unmuteUI = new _WebAudioUnmuteUI(this, options.defaultUIParentElement);
        }
    }

    /** @internal */
    public async _init(options: Partial<IWebAudioEngineOptions>): Promise<void> {
        this._resumeOnInteraction = typeof options.resumeOnInteraction === "boolean" ? options.resumeOnInteraction : true;
        this._resumeOnPause = typeof options.resumeOnPause === "boolean" ? options.resumeOnPause : true;
        this._resumeOnPauseRetryInterval = options.resumeOnPauseRetryInterval ?? 1000;

        document.addEventListener("click", this._onUserGesture);

        await this._initAudioContext();

        if (_HasSpatialAudioListenerOptions(options)) {
            this._listener = _CreateSpatialAudioListener(this, this._listenerAutoUpdate, this._listenerMinUpdateTime);
            this._listener.setOptions(options);
        }

        this._resolveIsReadyPromise();
    }

    /** @internal */
    public get currentTime(): number {
        return this._audioContext.currentTime ?? 0;
    }

    /** @internal */
    public get _inNode(): AudioNode {
        return this._audioContext.destination;
    }

    /** @internal */
    public get mainOut(): _WebAudioMainOut {
        return this._mainOut;
    }

    /** @internal */
    public get listener(): AbstractSpatialAudioListener {
        return this._listener ?? (this._listener = _CreateSpatialAudioListener(this, this._listenerAutoUpdate, this._listenerMinUpdateTime));
    }

    /** @internal */
    public get state(): AudioEngineV2State {
        return this._audioContext.state;
    }

    /** @internal */
    public get volume(): number {
        return this._volume;
    }

    /** @internal */
    public set volume(value: number) {
        if (this._volume === value) {
            return;
        }

        this._volume = value;

        if (this._mainOut) {
            this._mainOut.volume = value;
        }
    }

    /** @internal */
    public async createBusAsync(name: string, options: Partial<IAudioBusOptions> = {}): Promise<AudioBus> {
        const module = await import("./webAudioBus");

        const bus = new module._WebAudioBus(name, this, options);
        await bus._init(options);

        return bus;
    }

    /** @internal */
    public async createMainBusAsync(name: string, options: Partial<IMainAudioBusOptions> = {}): Promise<MainAudioBus> {
        const module = await import("./webAudioMainBus");

        const bus = new module._WebAudioMainBus(name, this);
        await bus._init(options);

        return bus;
    }

    /** @internal */
    public async createSoundAsync(
        name: string,
        source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
        options: Partial<IStaticSoundOptions> = {}
    ): Promise<StaticSound> {
        const module = await import("./webAudioStaticSound");

        const sound = new module._WebAudioStaticSound(name, this, options);
        await sound._init(source, options);

        return sound;
    }

    /** @internal */
    public async createSoundBufferAsync(
        source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
        options: Partial<IStaticSoundBufferOptions> = {}
    ): Promise<StaticSoundBuffer> {
        const module = await import("./webAudioStaticSound");

        const soundBuffer = new module._WebAudioStaticSoundBuffer(this);
        await soundBuffer._init(source, options);

        return soundBuffer;
    }

    /** @internal */
    public async createStreamingSoundAsync(name: string, source: HTMLMediaElement | string | string[], options: Partial<IStreamingSoundOptions> = {}): Promise<StreamingSound> {
        const module = await import("./webAudioStreamingSound");

        const sound = new module._WebAudioStreamingSound(name, this, options);
        await sound._init(source, options);

        return sound;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._listener?.dispose();
        this._listener = null;

        if (this._audioContext.state !== "closed") {
            this._audioContext.close();
        }

        document.removeEventListener("click", this._onUserGesture);
        this._audioContext.removeEventListener("statechange", this._onAudioContextStateChange);

        this._unmuteUI?.dispose();
        this._unmuteUI = null;
    }

    /** @internal */
    public flagInvalidFormat(format: string): void {
        this._invalidFormats.add(format);
    }

    /** @internal */
    public isFormatValid(format: string): boolean {
        if (this._validFormats.has(format)) {
            return true;
        }

        if (this._invalidFormats.has(format)) {
            return false;
        }

        const mimeType = FormatMimeTypes[format];
        if (mimeType === undefined) {
            return false;
        }

        const audio = new Audio();
        if (audio.canPlayType(mimeType) === "") {
            this._invalidFormats.add(format);
            return false;
        }

        this._validFormats.add(format);

        return true;
    }

    /** @internal */
    public override async pause(): Promise<void> {
        await this._audioContext.suspend();

        this._pauseCalled = true;
    }

    /** @internal */
    public override async resume(): Promise<void> {
        this._pauseCalled = false;

        if (this._resumePromise) {
            return this._resumePromise;
        }

        this._resumePromise = this._audioContext.resume();
        return this._resumePromise;
    }

    /** @internal */
    public override _addMainBus(mainBus: MainAudioBus): void {
        super._addMainBus(mainBus);
    }

    /** @internal */
    public override _removeMainBus(mainBus: MainAudioBus): void {
        super._removeMainBus(mainBus);
    }

    /** @internal */
    public override _addNode(node: AbstractNamedAudioNode): void {
        super._addNode(node);
    }

    /** @internal */
    public override _removeNode(node: AbstractNamedAudioNode): void {
        super._removeNode(node);
    }

    /** @internal */
    public _setAudioParam(audioParam: AudioParam, value: number) {
        audioParam.linearRampToValueAtTime(value, this.currentTime + this.parameterRampDuration);
    }

    private _initAudioContext: () => Promise<void> = async () => {
        this._audioContext.addEventListener("statechange", this._onAudioContextStateChange);

        this._mainOut = new _WebAudioMainOut(this);
        this._mainOut.volume = this._volume;

        await this.createMainBusAsync("default");
    };

    private _onAudioContextStateChange = () => {
        if (this.state === "running") {
            clearInterval(this._resumeOnPauseTimerId);
            this._audioContextStarted = true;
            this._resumePromise = null;
        }
        if (this.state === "suspended" || this.state === "interrupted") {
            if (this._audioContextStarted && this._resumeOnPause && !this._pauseCalled) {
                clearInterval(this._resumeOnPauseTimerId);

                this._resumeOnPauseTimerId = setInterval(() => {
                    this.resume();
                }, this._resumeOnPauseRetryInterval);
            }
        }

        this.stateChangedObservable.notifyObservers(this.state);
    };

    private _onUserGesture: () => void = async () => {
        if (this._resumeOnInteraction) {
            await this._audioContext.resume();
        }

        this.userGestureObservable.notifyObservers();
    };

    private _resolveIsReadyPromise: () => void;
}
