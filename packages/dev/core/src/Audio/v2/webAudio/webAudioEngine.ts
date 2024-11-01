import type { Nullable } from "../../../types";
import type { AudioBusOptions } from "../audioBus";
import { AbstractAudioEngine } from "../abstractAudioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AudioPositioner, AudioPositionerOptions } from "../audioPositioner";
import type { AudioSender } from "../audioSender";
import type { MainAudioBus } from "../mainAudioBus";
import type { MainAudioOutput } from "../mainAudioOutput";
import type { StaticSound, StaticSoundOptions } from "../staticSound";
import type { StaticSoundBuffer, StaticSoundBufferOptions } from "../staticSoundBuffer";
import type { StreamingSound, StreamingSoundOptions } from "../streamingSound";
import { WebAudioMainBus } from "./webAudioMainBus";
import { WebAudioMainOutput } from "./webAudioMainOutput";
import { WebAudioPositioner } from "./webAudioPositioner";
import { WebAudioSender } from "./webAudioSender";
import { WebAudioStaticSound, WebAudioStaticSoundBuffer, WebAudioStaticSoundInstance } from "./webAudioStaticSound";
import { WebAudioStreamingSound, WebAudioStreamingSoundInstance } from "./webAudioStreamingSound";

/**
 * Options for creating a new WebAudioBus.
 */
export interface WebAudioBusOptions extends AudioBusOptions {}

/**
 * Options for creating a new WebAudioEngine.
 */
export interface WebAudioEngineOptions {
    /**
     * The audio context to be used by the engine.
     */
    audioContext?: BaseAudioContext;
}

/**
 * Options for creating a new WebAudioPositioner.
 */
export interface WebAudioPositionerOptions extends AudioPositionerOptions {}

/**
 * Options for creating a new WebAudioStaticSoundBuffer.
 */
export interface WebAudioStaticSoundBufferOptions extends StaticSoundBufferOptions {
    /**
     * The ArrayBuffer to be used as the sound source.
     */
    sourceArrayBuffer?: ArrayBuffer;
    /**
     * The AudioBuffer to be used as the sound source.
     */
    sourceAudioBuffer?: AudioBuffer;
    /**
     * The URL of the sound buffer.
     */
    sourceUrl?: string;
    /**
     * Potential URLs of the sound buffer. The first one that is successfully loaded will be used.
     */
    sourceUrls?: string[];
    /**
     * Whether to skip codec checking when before attempting to load each source URL in `sourceUrls`.
     */
    sourceUrlsSkipCodecCheck?: boolean;
}

/**
 * Options for creating a new WebAudioStaticSound.
 */
export type WebAudioStaticSoundOptions = StaticSoundOptions &
    WebAudioStaticSoundBufferOptions & {
        sourceBuffer?: StaticSoundBuffer;
    };

/**
 * Options for creating a new WebAudioStreamingSound.
 */
export interface WebAudioStreamingSoundOptions extends StreamingSoundOptions {
    /**
     * The URL of the sound source.
     */
    sourceUrl?: string;
}

/**
 * Creates a new WebAudioEngine.
 * @param options - The options for creating the audio engine.
 * @returns A promise that resolves with the created audio engine.
 */
export async function CreateAudioEngine(options: Nullable<WebAudioEngineOptions> = null): Promise<WebAudioEngine> {
    const engine = new InternalWebAudioEngine();
    await engine.init(options);
    return engine;
}

/**
 * Abstract class for InternalWebAudioEngine.
 */
export abstract class WebAudioEngine extends AbstractAudioEngine {
    /**
     * Creates a new main audio bus.
     * @param name - The name of the main bus.
     * @returns A promise that resolves with the created main audio bus.
     */
    public override async createMainBus(name: string): Promise<MainAudioBus> {
        const bus = new WebAudioMainBus(name, this);
        await bus.init();
        this._addMainBus(bus);
        return bus;
    }

    /**
     * Creates a new main audio output.
     * @returns A promise that resolves with the created audio output.
     */
    public async createMainOutput(): Promise<MainAudioOutput> {
        const mainAudioOutput = new WebAudioMainOutput(this);
        await mainAudioOutput.init();
        return mainAudioOutput;
    }

    /**
     * Creates a new audio positioner.
     * @param parent - The parent node.
     * @param options - The options for creating the positioner.
     * @returns A promise that resolves with the created positioner.
     */
    public async createPositioner(parent: AbstractAudioNode, options: Nullable<WebAudioPositionerOptions> = null): Promise<AudioPositioner> {
        return new WebAudioPositioner(parent, options);
    }

    /**
     * Creates a new WebAudioSender.
     * @param parent - The parent audio node.
     * @returns A promise that resolves to the created WebAudioSender.
     */
    public async createSender(parent: AbstractAudioNode): Promise<AudioSender> {
        return new WebAudioSender(parent);
    }

    /**
     * Creates a new static sound.
     * @param name - The name of the sound.
     * @param options - The options for the static sound.
     * @returns A promise that resolves to the created static sound.
     */
    public async createSound(name: string, options: Nullable<WebAudioStaticSoundOptions> = null): Promise<StaticSound> {
        const sound = new WebAudioStaticSound(name, this, options);
        await sound.init(options);
        this._addSound(sound);
        return sound;
    }

    /**
     * Creates a new static sound buffer.
     * @param options - The options for the static sound buffer.
     * @returns A promise that resolves to the created static sound buffer.
     */
    public async createSoundBuffer(options: Nullable<WebAudioStaticSoundBufferOptions> = null): Promise<StaticSoundBuffer> {
        const buffer = new WebAudioStaticSoundBuffer(this);
        await buffer.init(options);
        return buffer;
    }

    /**
     * Creates a new streaming sound.
     * @param name - The name of the sound.
     * @param options - The options for the streaming sound.
     * @returns A promise that resolves to the created streaming sound.
     */
    public async createStreamingSound(name: string, options: Nullable<StreamingSoundOptions> = null): Promise<StreamingSound> {
        const sound = new WebAudioStreamingSound(name, this, options);
        await sound.init(options);
        this._addSound(sound);
        return sound;
    }

    public abstract formatIsValid(format: string): boolean;
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
export class InternalWebAudioEngine extends WebAudioEngine {
    private _audioContext: BaseAudioContext;
    private _mainOutput: Nullable<WebAudioMainOutput> = null;

    private _invalidFormats = new Set<string>();
    private _validFormats = new Set<string>();

    /** @internal */
    public get currentTime(): number {
        return this._audioContext.currentTime;
    }

    /** @internal */
    public get mainOutput(): Nullable<WebAudioMainOutput> {
        return this._mainOutput;
    }

    private async _initAudioContext(): Promise<void> {
        if (this._audioContext === undefined) {
            this._audioContext = new BaseAudioContext();
        }

        if (this._audioContext instanceof AudioContext) {
            await this._audioContext.resume();
        }

        this._resolveAudioContext(this._audioContext);

        document.removeEventListener("click", this._initAudioContext);
    }

    private _resolveAudioContext: (audioContext: BaseAudioContext) => void;

    /** @internal */
    public audioContext = new Promise<BaseAudioContext>((resolve) => {
        this._resolveAudioContext = resolve;
        document.addEventListener("click", this._initAudioContext.bind(this), { once: true });
    });

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._audioContext.destination;
    }

    /** @internal */
    public async init(options: Nullable<WebAudioEngineOptions> = null): Promise<void> {
        if (options?.audioContext) {
            this._audioContext = options.audioContext;
            this._initAudioContext();
        }

        this._mainOutput = (await this.createMainOutput()) as WebAudioMainOutput;

        await this.createMainBus("default");
    }

    /** @internal */
    public createStaticSoundInstance(source: WebAudioStaticSound): WebAudioStaticSoundInstance {
        const soundInstance = new WebAudioStaticSoundInstance(source);
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }

    /** @internal */
    public createStreamingSoundInstance(source: WebAudioStreamingSound): WebAudioStreamingSoundInstance {
        const soundInstance = new WebAudioStreamingSoundInstance(source);
        this._addSoundInstance(soundInstance);
        return soundInstance;
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
}
