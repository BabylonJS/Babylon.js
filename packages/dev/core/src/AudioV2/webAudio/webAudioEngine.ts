import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { AbstractNamedAudioNode } from "../abstractAudio/abstractAudioNode";
import type { AudioEngineV2State, IAudioEngineV2Options } from "../abstractAudio/audioEngineV2";
import { AudioEngineV2 } from "../abstractAudio/audioEngineV2";
import type { MainAudioBus } from "../abstractAudio/mainAudioBus";
import type { AbstractSpatialAudioListener } from "../abstractAudio/subProperties/abstractSpatialAudioListener";
import { _HasSpatialAudioListenerOptions } from "../abstractAudio/subProperties/abstractSpatialAudioListener";
import type { _SpatialAudioListener } from "../abstractAudio/subProperties/spatialAudioListener";
import { _CreateSpatialAudioListener } from "./subProperties/spatialWebAudioListener";
import { CreateMainAudioBusAsync } from "./webAudioMainBus";
import type { _WebAudioMainOut } from "./webAudioMainOut";
import { _CreateMainAudioOutAsync } from "./webAudioMainOut";

/**
 * Options for creating a v2 audio engine that uses the WebAudio API.
 */
export interface IWebAudioEngineOptions extends IAudioEngineV2Options {
    /**
     * The audio context to be used by the engine.
     */
    audioContext: AudioContext;
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
    await engine.init(options);
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
    private _resumeOnInteraction = true;
    private _resumeOnPause = true;
    private _resumeOnPauseRetryInterval = 1000;
    private _resumeOnPauseTimerId: any = null;
    private _resumePromise: Nullable<Promise<void>> = null;
    private _validFormats = new Set<string>();
    private _volume = 1;

    /** @internal */
    public readonly audioContext: AudioContext;

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
        super();

        this._volume = options.volume ?? 1;
        this.audioContext = options.audioContext ?? new AudioContext();
    }

    /** @internal */
    public async init(options: Partial<IWebAudioEngineOptions>): Promise<void> {
        this._resumeOnInteraction = options.resumeOnInteraction ?? true;
        this._resumeOnPause = options.resumeOnPause ?? true;
        this._resumeOnPauseRetryInterval = options.resumeOnPauseRetryInterval ?? 1000;

        document.addEventListener("click", this._onUserGesture);

        await this._initAudioContext();

        if (_HasSpatialAudioListenerOptions(options)) {
            this._listener = _CreateSpatialAudioListener(this);
            this._listener.setOptions(options);
        }

        this._resolveIsReadyPromise();
    }

    /** @internal */
    public get currentTime(): number {
        return this.audioContext.currentTime ?? 0;
    }

    /** @internal */
    public get inNode(): AudioNode {
        return this.audioContext.destination;
    }

    /** @internal */
    public get mainOut(): _WebAudioMainOut {
        return this._mainOut;
    }

    /** @internal */
    public get listener(): AbstractSpatialAudioListener {
        return this._listener ?? (this._listener = _CreateSpatialAudioListener(this));
    }

    /** @internal */
    public get state(): AudioEngineV2State {
        return this.audioContext.state;
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
    public override dispose(): void {
        super.dispose();

        this._listener = null;

        if (this.audioContext.state !== "closed") {
            this.audioContext.close();
        }

        document.removeEventListener("click", this._onUserGesture);
        this.audioContext.removeEventListener("statechange", this._onAudioContextStateChange);
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
        await this.audioContext.suspend();
    }

    /** @internal */
    public override async resume(): Promise<void> {
        if (this._resumePromise) {
            return this._resumePromise;
        }

        this._resumePromise = this.audioContext.resume();
        return this._resumePromise;
    }

    /** @internal */
    public addMainBus(mainBus: MainAudioBus): void {
        this._addMainBus(mainBus);
    }

    /** @internal */
    public removeMainBus(mainBus: MainAudioBus): void {
        this._removeMainBus(mainBus);
    }

    /** @internal */
    public addNode(node: AbstractNamedAudioNode): void {
        this._addNode(node);
    }

    /** @internal */
    public removeNode(node: AbstractNamedAudioNode): void {
        this._removeNode(node);
    }

    private _initAudioContext: () => Promise<void> = async () => {
        this.audioContext.addEventListener("statechange", this._onAudioContextStateChange);

        this._mainOut = await _CreateMainAudioOutAsync(this);
        this._mainOut.volume = this._volume;

        await CreateMainAudioBusAsync("default", this);
    };

    private _onAudioContextStateChange = () => {
        if (this.state === "running") {
            clearInterval(this._resumeOnPauseTimerId);
            this._audioContextStarted = true;
            this._resumePromise = null;
        }
        if (this.state === "suspended" || this.state === "interrupted") {
            if (this._audioContextStarted && this._resumeOnPause) {
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
            await this.audioContext.resume();
        }

        this.userGestureObservable.notifyObservers();
    };

    private _resolveIsReadyPromise: () => void;
}
