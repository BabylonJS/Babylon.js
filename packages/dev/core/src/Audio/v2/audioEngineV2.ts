import type { Vector3 } from "../../Maths/math.vector";
import type { Nullable } from "../../types";
import type { AbstractAudioNode, NamedAbstractAudioNode } from "./abstractAudioNode";
import type { MainAudioBus } from "./mainAudioBus";
import type { AbstractSpatialAudioListener } from "./subProperties/abstractSpatialAudioListener";

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

/** */
export interface IAudioEngineV2Options {
    /**
     * Whether the audio engine listener should be enabled when the audio engine is created. Defaults to `false`.
     */
    listenerEnabled: boolean;

    /**
     * The initial position of the audio engine listener. Defaults to `(0, 0, 0)`.
     */
    listenerPosition: Vector3;

    /**
     * The initial rotation of the audio engine listener. Defaults to `(0, 0, 0)`.
     */
    listenerRotation: Vector3;

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
    private readonly _nodes = new Set<NamedAbstractAudioNode>();

    private _defaultMainBus: Nullable<MainAudioBus> = null;

    protected constructor() {
        Instances.push(this);
    }

    /**
     * The elapsed time since the audio engine was started, in seconds.
     */
    public abstract get currentTime(): number;

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
     * `true` if the engine is a WebAudio engine; otherwise `false`.
     */
    public abstract get isWebAudio(): boolean;

    /**
     * The spatial audio listener properties for the audio engine.
     * - Each audio engine has exactly one listener.
     */
    public abstract get listener(): AbstractSpatialAudioListener;

    /**
     * The main output node.
     * - This is the last node in the audio graph before the audio is sent to the speakers.
     */
    public abstract get mainOut(): AbstractAudioNode;

    /**
     * The current state of the audio engine.
     */
    public abstract get state(): AudioEngineV2State;

    /**
     * The output volume of the audio engine.
     */
    public abstract get volume(): number;
    public abstract set volume(value: number);

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
    public abstract formatIsValid(format: string): boolean;

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
     * - Note that the returned promise resolves immediately if the audio engine is already unlocked.
     * @returns A promise that resolves when the audio engine is unlocked.
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

    protected _addNode(node: NamedAbstractAudioNode): void {
        this._nodes.add(node);
    }

    protected _removeNode(node: NamedAbstractAudioNode): void {
        this._nodes.delete(node);
    }
}
