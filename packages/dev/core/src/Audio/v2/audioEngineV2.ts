import type { Vector3 } from "../../Maths/math.vector";
import type { Nullable } from "../../types";
import type { AbstractAudioNode, NamedAbstractAudioNode } from "./abstractAudioNode";
import type { MainAudioBus } from "./mainAudioBus";

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
    /** */
    listenerPosition?: Vector3;

    /** */
    volume?: number;
}

/**
 * Abstract base class for audio engines.
 */
export abstract class AudioEngineV2 {
    private _defaultMainBus: Nullable<MainAudioBus> = null;

    // Not owned, but all items should be in `_nodes` container, too, which is owned.
    private readonly _mainBuses = new Set<MainAudioBus>();

    // Owned top-level sound and bus nodes.
    private readonly _nodes = new Set<NamedAbstractAudioNode>();

    /**
     * `true` if the engine is a WebAudio engine; otherwise `false`.
     */
    public abstract get isWebAudio(): boolean;

    /**
     * The current state of the audio engine.
     */
    public abstract get state(): string;

    /**
     * The current time in seconds.
     */
    public abstract get currentTime(): number;

    /**
     * The main output node.
     */
    public abstract get mainOut(): AbstractAudioNode;

    /**
     * The default main bus.
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

    protected constructor() {
        Instances.push(this);
    }

    public abstract get listenerPosition(): Vector3;
    public abstract set listenerPosition(value: Vector3);

    // public abstract get listenerForward(): Vector3;
    // public abstract set listenerForward(value: Vector3);

    // public abstract get listenerUp(): Vector3;
    // public abstract set listenerUp(value: Vector3);

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

        this._nodes.clear();
        this._mainBuses.clear();
    }

    /**
     * Checks if the specified format is valid.
     * @param format The format to check. The format is the audio file extension, such as "mp3" or "wav".
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
