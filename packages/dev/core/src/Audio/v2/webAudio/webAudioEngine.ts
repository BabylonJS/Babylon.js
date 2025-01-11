import { Observable } from "../../../Misc/observable";
import type { Nullable } from "../../../types";
import type { NamedAbstractAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2State, IAudioEngineV2Options } from "../audioEngineV2";
import { AudioEngineV2 } from "../audioEngineV2";
import type { MainAudioBus } from "../mainAudioBus";
import type { AbstractSpatialAudioListener } from "../subProperties/abstractSpatialAudioListener";
import { _CreateSpatialAudioListener } from "./subProperties/spatialWebAudioListener";
import { CreateMainAudioBusAsync } from "./webAudioMainBus";
import type { _WebAudioMainOut } from "./webAudioMainOut";
import { _CreateMainAudioOutAsync } from "./webAudioMainOut";

/**
 * Options for creating a new v2 audio engine that uses the WebAudio API.
 */
export interface IWebAudioEngineOptions extends IAudioEngineV2Options {
    /**
     * The audio context to be used by the engine.
     */
    audioContext: AudioContext;

    /**
     * Set to `true` to automatically resume the audio context when the user interacts with the page. Default is `true`.
     */
    resumeOnInteraction: boolean;

    /**
     * Set to `true` to automatically resume the audio context when the browser pauses audio playback. Default is `true`.
     */
    resumeOnPause: boolean;

    /**
     * The interval in milliseconds to try resuming audio playback when `resumeOnPause` is `true`. Default is `1000`.
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

const FormatMimeTypeMap = new Map<string, string>([
    ["aac", "audio/aac"],
    ["ac3", "audio/ac3"],
    ["flac", "audio/flac"],
    ["m4a", "audio/mp4"],
    ["mp3", 'audio/mpeg; codecs="mp3"'],
    ["mp4", "audio/mp4"],
    ["ogg", 'audio/ogg; codecs="vorbis"'],
    ["wav", "audio/wav"],
    ["webm", 'audio/webm; codecs="vorbis"'],
]);

/** @internal */
export class _WebAudioEngine extends AudioEngineV2 {
    private _audioContextStarted = false;
    private _resumePromise: Nullable<Promise<void>> = null;

    private _mainOutput: _WebAudioMainOut;

    private _invalidFormats = new Set<string>();
    private _validFormats = new Set<string>();
    private _volume = 1;

    private _listener: Nullable<AbstractSpatialAudioListener> = null;

    /** @internal */
    public readonly audioContext: AudioContext;

    /** @internal */
    public get isWebAudio(): boolean {
        return true;
    }

    /** @internal */
    public readonly isReadyPromise: Promise<void> = new Promise((resolve) => {
        this._resolveIsReadyPromise = resolve;
    });

    private _resolveIsReadyPromise: () => void;

    /** @internal */
    public get currentTime(): number {
        return this.audioContext.currentTime ?? 0;
    }

    /** @internal */
    public get mainOut(): _WebAudioMainOut {
        return this._mainOutput;
    }

    private _initAudioContext: () => Promise<void> = async () => {
        this.audioContext.addEventListener("statechange", this._onAudioContextStateChange);

        this._mainOutput = await _CreateMainAudioOutAsync(this);
        this._mainOutput.volume = this._volume;

        await CreateMainAudioBusAsync("default", this);
    };

    private _onUserGesture: () => void = async () => {
        if (this._resumeOnInteraction) {
            await this.audioContext.resume();
        }

        this.userGestureObservable.notifyObservers();
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

    private _resumeOnInteraction = true;
    private _resumeOnPause = true;
    private _resumeOnPauseRetryInterval = 1000;
    private _resumeOnPauseTimerId: any = null;

    /** @internal */
    public userGestureObservable: Observable<void> = new Observable();

    /** @internal */
    public get state(): AudioEngineV2State {
        return this.audioContext.state;
    }

    /** @internal */
    public stateChangedObservable: Observable<string> = new Observable();

    /** @internal */
    public get inNode(): AudioNode {
        return this.audioContext.destination;
    }

    /** @internal */
    public get listener(): AbstractSpatialAudioListener {
        return this._listener ?? (this._listener = _CreateSpatialAudioListener(this));
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

        if (this._mainOutput) {
            this._mainOutput.volume = value;
        }
    }

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

        if (options.listenerEnabled) {
            this._listener = _CreateSpatialAudioListener(this);
        }
        if (options.listenerPosition) {
            this.listener.position = options.listenerPosition;
        }
        if (options.listenerRotation) {
            this.listener.rotation = options.listenerRotation;
        }

        this._resolveIsReadyPromise();
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
    public formatIsValid(format: string): boolean {
        if (this._validFormats.has(format)) {
            return true;
        }

        if (this._invalidFormats.has(format)) {
            return false;
        }

        const mimeType = FormatMimeTypeMap.get(format);
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
    public addNode(node: NamedAbstractAudioNode): void {
        this._addNode(node);
    }

    /** @internal */
    public removeNode(node: NamedAbstractAudioNode): void {
        this._removeNode(node);
    }
}
