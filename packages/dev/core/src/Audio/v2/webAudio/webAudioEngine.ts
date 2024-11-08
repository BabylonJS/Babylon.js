import type { Nullable } from "../../../types";
import { AbstractAudioEngine } from "../abstractAudioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractSound } from "../abstractSound";
import type { AbstractSoundInstance } from "../abstractSoundInstance";
import type { MainAudioBus } from "../mainAudioBus";
import { CreateMainAudioBusAsync } from "./webAudioMainBus";
import { CreateMainAudioOutputAsync } from "./webAudioMainOutput";

/**
 * Options for creating a new WebAudioEngine.
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
 * Creates a new WebAudioEngine.
 * @param options - The options for creating the audio engine.
 * @returns A promise that resolves with the created audio engine.
 */
export async function CreateAudioEngineAsync(options: Nullable<IWebAudioEngineOptions> = null): Promise<AbstractAudioEngine> {
    const engine = new WebAudioEngine();
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
export class WebAudioEngine extends AbstractAudioEngine {
    private _audioContext: AudioContext | OfflineAudioContext;
    private _audioContextStarted = false;

    private _onAudioContextStateChange = (() => {
        if (this.state === "running") {
            this._audioContextStarted = true;
        }
        if (this.state === "suspended" || this.state === "interrupted") {
            if (this._resumeOnInteraction) {
                document.addEventListener("click", this._onInteraction, { once: true });
            }
        }
    }).bind(this);

    private _mainOutput: Nullable<AbstractAudioNode> = null;

    private _invalidFormats = new Set<string>();
    private _validFormats = new Set<string>();

    /** @internal */
    public get isWebAudio(): boolean {
        return true;
    }

    /** @internal */
    public get currentTime(): number {
        return this._audioContext.currentTime;
    }

    /** @internal */
    public get mainOutput(): Nullable<AbstractAudioNode> {
        return this._mainOutput;
    }

    private _initAudioContext: () => void = (async () => {
        if (this._audioContext === undefined) {
            this._audioContext = new AudioContext();
        }

        this._audioContext.addEventListener("statechange", this._onAudioContextStateChange);

        await this.resume();

        document.removeEventListener("click", this._initAudioContext);
    }).bind(this);

    private _resolveAudioContext: (audioContext: BaseAudioContext) => void;

    private _resumeOnInteraction = true;

    private _onInteraction = (() => {
        if (this._resumeOnInteraction) {
            this.resume();
        }

        document.removeEventListener("click", this._onInteraction);
    }).bind(this);

    /** @internal */
    public audioContext: Promise<BaseAudioContext>;

    /** @internal */
    public get state(): string {
        return this._audioContext.state;
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._audioContext.destination;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioEngineOptions> = null): Promise<void> {
        this.audioContext = new Promise<BaseAudioContext>((resolve) => {
            this._resolveAudioContext = resolve;

            if (this._resumeOnInteraction) {
                document.addEventListener("click", this._initAudioContext, { once: true });
            }
        });

        if (options?.audioContext) {
            this._audioContext = options.audioContext;
            this._initAudioContext();
        }

        this._resumeOnInteraction = options?.resumeOnInteraction ?? true;

        await this.audioContext;
        this._mainOutput = await CreateMainAudioOutputAsync(this);
        await CreateMainAudioBusAsync("default", this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        if (this._audioContext instanceof AudioContext) {
            this._audioContext.close();
        }

        document.removeEventListener("click", this._initAudioContext);
        document.removeEventListener("click", this._onInteraction);
        this._audioContext.removeEventListener("statechange", this._onAudioContextStateChange);
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
        if (this._audioContext === undefined) {
            this._initAudioContext();
        }

        if (this._audioContext instanceof AudioContext) {
            await this._audioContext.resume();
            this._resolveAudioContext(this._audioContext);
        } else if (this._audioContext instanceof OfflineAudioContext) {
            if (this._audioContextStarted) {
                return this._audioContext.resume();
            }
        }

        this._resolveAudioContext(this._audioContext);
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
    public addSoundInstance(soundInstance: AbstractSoundInstance): void {
        this._addSoundInstance(soundInstance);
    }
}
