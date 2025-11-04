import type { Nullable } from "../../types";
import type { IAudioParameterRampOptions } from "../audioParameter";
import type { AbstractAudioNode, AbstractNamedAudioNode } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";
import type { AbstractSoundSource, ISoundSourceOptions } from "./abstractSoundSource";
import type { AudioBus, IAudioBusOptions } from "./audioBus";
import type { IMainAudioBusOptions, MainAudioBus } from "./mainAudioBus";
import type { IStaticSoundOptions, StaticSound } from "./staticSound";
import type { IStaticSoundBufferOptions, StaticSoundBuffer } from "./staticSoundBuffer";
import type { IStreamingSoundOptions, StreamingSound } from "./streamingSound";
import type { AbstractSpatialAudioListener, ISpatialAudioListenerOptions } from "./subProperties/abstractSpatialAudioListener";

const Instances: AudioEngineV2[] = [];

/**
 * Gets the most recently created v2 audio engine.
 * @returns The most recently created v2 audio engine.
 */
export function LastCreatedAudioEngine(): Nullable<AudioEngineV2> {
    if (Instances.length === 0) {
        return null;
    }

    return Instances[Instances.length - 1];
}

/**
 * Options for creating a v2 audio engine.
 */
export interface IAudioEngineV2Options extends ISpatialAudioListenerOptions {
    /**
     * The smoothing duration to use when changing audio parameters, in seconds. Defaults to `0.01` (10 milliseconds).
     */
    parameterRampDuration: number;
    /**
     * The initial output volume of the audio engine. Defaults to `1`.
     */
    volume: number;
}

/**
 * The state of a v2 audio engine.
 * @see {@link AudioEngineV2.state}
 */
export type AudioEngineV2State = "closed" | "interrupted" | "running" | "suspended";

/**
 * Abstract base class for v2 audio engines.
 *
 * A v2 audio engine based on the WebAudio API can be created with the {@link CreateAudioEngineAsync} function.
 */
export abstract class AudioEngineV2 {
    /** Not owned, but all items should be in `_nodes` container, too, which is owned. */
    private readonly _mainBuses = new Set<MainAudioBus>();
    private readonly _sounds = new Array<AbstractSound>();

    /** Owned top-level sound and bus nodes. */
    private readonly _nodes = new Set<AbstractNamedAudioNode>();

    private _defaultMainBus: Nullable<MainAudioBus> = null;

    private _parameterRampDuration: number = 0.01;

    protected constructor(options: Partial<IAudioEngineV2Options>) {
        Instances.push(this);

        if (typeof options.parameterRampDuration === "number") {
            this.parameterRampDuration = options.parameterRampDuration;
        }
    }

    /**
     * The elapsed time since the audio engine was started, in seconds.
     */
    public abstract readonly currentTime: number;

    /**
     * The default main bus that will be used for audio buses and sounds if their `outBus` option is not set.
     * @see {@link IAudioBusOptions.outBus}
     * @see {@link IAbstractSoundOptions.outBus}
     */
    public get defaultMainBus(): Nullable<MainAudioBus> {
        if (this._mainBuses.size === 0) {
            return null;
        }

        if (!this._defaultMainBus) {
            this._defaultMainBus = Array.from(this._mainBuses)[0];
        }

        return this._defaultMainBus;
    }

    /**
     * The spatial audio listener properties for the audio engine.
     * - Each audio engine has exactly one listener.
     */
    public abstract readonly listener: AbstractSpatialAudioListener;

    /**
     * The main output node.
     * - This is the last node in the audio graph before the audio is sent to the speakers.
     */
    public abstract readonly mainOut: AbstractAudioNode;

    /**
     * The current state of the audio engine.
     *
     * Possible values are:
     * - `"closed"`: The audio engine has been closed.
     * - `"interrupted"`: The audio engine has been interrupted and is not running.
     * - `"running"`: The audio engine is running normally.
     * - `"suspended"`: The audio engine is suspended and is not running.
     */
    public abstract readonly state: AudioEngineV2State;

    /**
     * The output volume of the audio engine.
     */
    public abstract volume: number;

    /**
     * The smoothing duration to use when changing audio parameters, in seconds. Defaults to `0.01` (10 milliseconds).
     *
     * Due to limitations in some browsers, it is not recommended to set this value to longer than `0.01` seconds.
     *
     * Setting this value to longer than `0.01` seconds may result in errors being throw when setting audio parameters.
     */
    public get parameterRampDuration(): number {
        return this._parameterRampDuration;
    }

    public set parameterRampDuration(value: number) {
        this._parameterRampDuration = Math.max(0, value);
    }

    /**
     * The list of static and streaming sounds created by the audio engine.
     */
    public get sounds(): ReadonlyArray<AbstractSound> {
        return this._sounds;
    }

    /**
     * Creates a new audio bus.
     * @param name - The name of the audio bus.
     * @param options - The options to use when creating the audio bus.
     * @returns A promise that resolves with the created audio bus.
     */
    public abstract createBusAsync(name: string, options?: Partial<IAudioBusOptions>): Promise<AudioBus>;

    /**
     * Creates a new main audio bus.
     * @param name - The name of the main audio bus.
     * @param options - The options to use when creating the main audio bus.
     * @returns A promise that resolves with the created main audio bus.
     */
    public abstract createMainBusAsync(name: string, options?: Partial<IMainAudioBusOptions>): Promise<MainAudioBus>;

    /**
     * Creates a new microphone sound source.
     * @param name - The name of the sound.
     * @param options - The options for the sound source.
     * @returns A promise that resolves to the created sound source.
     */
    public abstract createMicrophoneSoundSourceAsync(name: string, options?: Partial<ISoundSourceOptions>): Promise<AbstractSoundSource>;

    /**
     * Creates a new static sound.
     * @param name - The name of the sound.
     * @param source - The source of the sound.
     * @param options - The options for the static sound.
     * @returns A promise that resolves to the created static sound.
     */
    public abstract createSoundAsync(
        name: string,
        source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
        options?: Partial<IStaticSoundOptions>
    ): Promise<StaticSound>;

    /**
     * Creates a new static sound buffer.
     * @param source - The source of the sound buffer.
     * @param options - The options for the static sound buffer.
     * @returns A promise that resolves to the created static sound buffer.
     */
    public abstract createSoundBufferAsync(
        source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
        options?: Partial<IStaticSoundBufferOptions>
    ): Promise<StaticSoundBuffer>;

    /**
     * Creates a new sound source.
     * @param name - The name of the sound.
     * @param source - The source of the sound.
     * @param options - The options for the sound source.
     * @returns A promise that resolves to the created sound source.
     */
    public abstract createSoundSourceAsync(name: string, source: AudioNode, options?: Partial<ISoundSourceOptions>): Promise<AbstractSoundSource>;

    /**
     * Creates a new streaming sound.
     * @param name - The name of the sound.
     * @param source - The source of the sound.
     * @param options - The options for the streaming sound.
     * @returns A promise that resolves to the created streaming sound.
     */
    public abstract createStreamingSoundAsync(name: string, source: HTMLMediaElement | string | string[], options?: Partial<IStreamingSoundOptions>): Promise<StreamingSound>;

    /**
     * Releases associated resources.
     */
    public dispose(): void {
        if (Instances.includes(this)) {
            Instances.splice(Instances.indexOf(this), 1);
        }

        const nodeIt = this._nodes.values();
        for (let next = nodeIt.next(); !next.done; next = nodeIt.next()) {
            next.value.dispose();
        }

        this._mainBuses.clear();
        this._nodes.clear();
        this._sounds.length = 0;

        this._defaultMainBus = null;
    }

    /**
     * Checks if the specified format is valid.
     * @param format The format to check as an audio file extension like "mp3" or "wav".
     * @returns `true` if the format is valid; otherwise `false`.
     */
    public abstract isFormatValid(format: string): boolean;

    /**
     * Pauses the audio engine if it is running.
     * @returns A promise that resolves when the audio engine is paused.
     */
    public abstract pauseAsync(): Promise<void>;

    /**
     * Resumes the audio engine if it is not running.
     * @returns A promise that resolves when the audio engine is running.
     */
    public abstract resumeAsync(): Promise<void>;

    /**
     * Sets the audio output volume with optional ramping.
     * If the duration is 0 then the volume is set immediately, otherwise it is ramped to the new value over the given duration using the given shape.
     * If a ramp is already in progress then the volume is not set and an error is thrown.
     * @param value The value to set the volume to.
     * @param options The options to use for ramping the volume change.
     */
    public abstract setVolume(value: number, options?: Partial<IAudioParameterRampOptions>): void;

    /**
     * Unlocks the audio engine if it is locked.
     * - Note that the returned promise may already be resolved if the audio engine is already unlocked.
     * @returns A promise that is resolved when the audio engine is unlocked.
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public unlockAsync(): Promise<void> {
        return this.resumeAsync();
    }

    protected _addMainBus(mainBus: MainAudioBus): void {
        this._mainBuses.add(mainBus);

        this._addNode(mainBus);
    }

    protected _removeMainBus(mainBus: MainAudioBus): void {
        this._mainBuses.delete(mainBus);
        this._defaultMainBus = null;

        this._removeNode(mainBus);
    }

    protected _addNode(node: AbstractNamedAudioNode): void {
        this._nodes.add(node);
    }

    protected _removeNode(node: AbstractNamedAudioNode): void {
        this._nodes.delete(node);
    }

    protected _addSound(sound: AbstractSound): void {
        this._sounds.push(sound);
        this._addNode(sound);
    }

    protected _removeSound(sound: AbstractSound): void {
        const index = this._sounds.indexOf(sound);
        if (index !== -1) {
            this._sounds.splice(index, 1);
        }
        this._removeNode(sound);
    }
}

/**
 * @internal
 * @param engine - The given audio engine. If `null` then the last created audio engine is used.
 * @returns the given audio engine or the last created audio engine.
 * @throws An error if the resulting engine is `null`.
 */
export function _GetAudioEngine(engine: Nullable<AudioEngineV2>): AudioEngineV2 {
    if (!engine) {
        engine = LastCreatedAudioEngine();
    }

    if (engine) {
        return engine;
    }

    throw new Error("No audio engine.");
}

/**
 * Creates a new audio bus.
 * @param name - The name of the audio bus.
 * @param options - The options to use when creating the audio bus.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created audio bus.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
export function CreateAudioBusAsync(name: string, options: Partial<IAudioBusOptions> = {}, engine: Nullable<AudioEngineV2> = null): Promise<AudioBus> {
    engine = _GetAudioEngine(engine);
    return engine.createBusAsync(name, options);
}

/**
 * Creates a new main audio bus.
 * @param name - The name of the main audio bus.
 * @param options - The options to use when creating the main audio bus.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created main audio bus.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
export function CreateMainAudioBusAsync(name: string, options: Partial<IMainAudioBusOptions> = {}, engine: Nullable<AudioEngineV2> = null): Promise<MainAudioBus> {
    engine = _GetAudioEngine(engine);
    return engine.createMainBusAsync(name, options);
}

/**
 * Creates a new microphone sound source.
 * @param name - The name of the sound.
 * @param options - The options for the sound source.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created sound source.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
export function CreateMicrophoneSoundSourceAsync(name: string, options: Partial<ISoundSourceOptions> = {}, engine: Nullable<AudioEngineV2> = null): Promise<AbstractSoundSource> {
    engine = _GetAudioEngine(engine);
    return engine.createMicrophoneSoundSourceAsync(name, options);
}

/**
 * Creates a new static sound.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param options - The options for the static sound.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created static sound.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
export function CreateSoundAsync(
    name: string,
    source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
    options: Partial<IStaticSoundOptions> = {},
    engine: Nullable<AudioEngineV2> = null
): Promise<StaticSound> {
    engine = _GetAudioEngine(engine);
    return engine.createSoundAsync(name, source, options);
}

/**
 * Creates a new static sound buffer.
 * @param source - The source of the sound buffer.
 * @param options - The options for the static sound buffer.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created static sound buffer.
 */
export async function CreateSoundBufferAsync(
    source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
    options: Partial<IStaticSoundBufferOptions> = {},
    engine: Nullable<AudioEngineV2> = null
): Promise<StaticSoundBuffer> {
    engine = _GetAudioEngine(engine);
    return await engine.createSoundBufferAsync(source, options);
}

/**
 * Creates a new sound source.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param options - The options for the sound source.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created sound source.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
export function CreateSoundSourceAsync(
    name: string,
    source: AudioNode,
    options: Partial<ISoundSourceOptions> = {},
    engine: Nullable<AudioEngineV2> = null
): Promise<AbstractSoundSource> {
    engine = _GetAudioEngine(engine);
    return engine.createSoundSourceAsync(name, source, options);
}

/**
 * Creates a new streaming sound.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param options - The options for the streaming sound.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created streaming sound.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
export function CreateStreamingSoundAsync(
    name: string,
    source: HTMLMediaElement | string | string[],
    options: Partial<IStreamingSoundOptions> = {},
    engine: Nullable<AudioEngineV2> = null
): Promise<StreamingSound> {
    engine = _GetAudioEngine(engine);
    return engine.createStreamingSoundAsync(name, source, options);
}
