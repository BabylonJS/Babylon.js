import type { Nullable } from "../../types";
import type { AbstractAudioNode, AbstractNamedAudioNode } from "./abstractAudioNode";
import type { MainAudioBus } from "./mainAudioBus";
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

    /** Owned top-level sound and bus nodes. */
    private readonly _nodes = new Set<AbstractNamedAudioNode>();

    private _defaultMainBus: Nullable<MainAudioBus> = null;

    protected constructor() {
        Instances.push(this);
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
     * The current state of the audio engine. Possible values are:
     * - `closed`: The audio engine has been closed.
     * - `interrupted`: The audio engine has been interrupted and is not running.
     * - `running`: The audio engine is running normally.
     * - `suspended`: The audio engine is suspended and is not running.
     */
    public abstract readonly state: AudioEngineV2State;

    /**
     * The output volume of the audio engine.
     */
    public abstract volume: number;

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
    public abstract pause(): Promise<void>;

    /**
     * Resumes the audio engine if it is not running.
     * @returns A promise that resolves when the audio engine is running.
     */
    public abstract resume(): Promise<void>;

    /**
     * Unlocks the audio engine if it is locked.
     * - Note that the returned promise may already be resolved if the audio engine is already unlocked.
     * @returns A promise that is resolved when the audio engine is unlocked.
     */
    public unlock(): Promise<void> {
        return this.resume();
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
}
