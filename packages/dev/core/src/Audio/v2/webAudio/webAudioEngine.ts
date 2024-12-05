import { Observable } from "../../../Misc/observable";
import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractSound } from "../abstractSound";
import type { _AbstractSoundInstance } from "../abstractSoundInstance";
import { AudioEngineV2 } from "../audioEngineV2";
import type { MainAudioBus } from "../mainAudioBus";
import { CreateMainAudioBusAsync } from "./webAudioMainBus";
import type { _WebAudioMainOutput } from "./webAudioMainOutput";
import { _CreateMainAudioOutputAsync } from "./webAudioMainOutput";

/**
 * Options for creating a new v2 audio engine that uses the WebAudio API.
 */
export interface IWebAudioEngineOptions {
    /**
     * The audio context to be used by the engine.
     */
    audioContext?: AudioContext | OfflineAudioContext;

    /**
     * Set to `true` to automatically resume the audio context when the user interacts with the page; otherwise `false`. Default is `true`.
     */
    resumeOnInteraction?: boolean;
}

/**
 * Creates a new v2 audio engine that uses the WebAudio API.
 * @param options - The options for creating the audio engine.
 * @returns A promise that resolves with the created audio engine.
 */
export async function CreateAudioEngineAsync(options: Nullable<IWebAudioEngineOptions> = null): Promise<AudioEngineV2> {
    const engine = new _WebAudioEngine();
    await engine.init(options);
    return engine;
}

const formatMimeTypeMap = new Map<string, string>([
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
    private _audioContext: Nullable<AudioContext | OfflineAudioContext>;
    private _audioContextStarted = false;

    private _mainOutput: Nullable<_WebAudioMainOutput> = null;

    private _invalidFormats = new Set<string>();
    private _validFormats = new Set<string>();
    private _volume = 1;

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
        return this._audioContext?.currentTime ?? 0;
    }

    /** @internal */
    public get mainOutput(): Nullable<AbstractAudioNode> {
        return this._mainOutput;
    }

    private _initAudioContext: () => Promise<void> = async () => {
        if (!this._audioContext) {
            return;
        }

        this._audioContext.addEventListener("statechange", this._onAudioContextStateChange);

        if (this.state !== "running" && this._resumeOnInteraction) {
            document.addEventListener("click", this._onUserInteraction, { once: true });
            this._audioContext.resume();
        }

        this._mainOutput = await _CreateMainAudioOutputAsync(this);
        this._mainOutput.volume = this._volume;

        await CreateMainAudioBusAsync("default", this);
    };

    private _onUserInteraction: () => void = async () => {
        await this.audioContext.resume();
    };

    private _onAudioContextStateChange = () => {
        if (this.state === "running") {
            this._audioContextStarted = true;
            document.removeEventListener("click", this._onUserInteraction);
        }
        if (this.state === "suspended" || this.state === "interrupted") {
            if (this._resumeOnInteraction) {
                document.addEventListener("click", this._onUserInteraction, { once: true });
            }
        }

        this.stateChangedObservable.notifyObservers(this.state);
    };

    private _resumeOnInteraction = true;

    /** @internal */
    public get audioContext(): AudioContext | OfflineAudioContext {
        if (!this._audioContext) {
            this._audioContext = new AudioContext();
            this._initAudioContext();
        }

        return this._audioContext!;
    }

    /** @internal */
    public get state(): string {
        return this._audioContext?.state ?? "uninitialized";
    }

    /** @internal */
    public stateChangedObservable: Observable<string> = new Observable();

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this.audioContext.destination;
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
            this._mainOutput.volume;
        }
    }

    /** @internal */
    public constructor() {
        super();
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioEngineOptions> = null): Promise<void> {
        this._audioContext = options?.audioContext ?? null;
        this._resumeOnInteraction = options?.resumeOnInteraction ?? true;

        await this._initAudioContext();
        this._resolveIsReadyPromise();
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        if (this._audioContext instanceof AudioContext && this._audioContext.state !== "closed") {
            this._audioContext.close();
        }

        document.removeEventListener("click", this._onUserInteraction);
        this._audioContext?.removeEventListener("statechange", this._onAudioContextStateChange);
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

        const mimeType = formatMimeTypeMap.get(format);
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
    public override async pause(waitTime: Nullable<number> = null): Promise<void> {
        if (this._audioContext instanceof AudioContext) {
            await this._audioContext.suspend();
        } else if (this._audioContext instanceof OfflineAudioContext) {
            return this._audioContext.suspend(waitTime ?? 0);
        }
    }

    /** @internal */
    public override async resume(): Promise<void> {
        const audioContext = this.audioContext;

        if (audioContext instanceof AudioContext) {
            return audioContext.resume();
        } else if (audioContext instanceof OfflineAudioContext) {
            if (this._audioContextStarted) {
                return audioContext.resume();
            }
        }
    }

    /** @internal */
    public addMainBus(mainBus: MainAudioBus): void {
        this._addMainBus(mainBus);
    }

    /** @internal */
    public addSound(sound: AbstractSound): void {
        this._addSound(sound);
    }

    /** @internal */
    public addSoundInstance(soundInstance: _AbstractSoundInstance): void {
        this._addSoundInstance(soundInstance);
    }
}
