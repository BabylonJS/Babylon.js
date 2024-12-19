import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractAudioSuperNode } from "./abstractAudioSuperNode";
import type { MainAudioBus } from "./mainAudioBus";

const instances: AudioEngineV2[] = [];

/**
 * Gets the most recently created v2 audio engine.
 * @returns The most recently created v2 audio engine.
 */
export function LastCreatedAudioEngine(): Nullable<AudioEngineV2> {
    if (instances.length === 0) {
        return null;
    }

    return instances[instances.length - 1];
}

/**
 * Abstract base class for audio engines.
 */
export abstract class AudioEngineV2 {
    private _defaultMainBus: Nullable<MainAudioBus> = null;

    // Not owned, but all items should be in `superNodes` container, too, which is owned.
    private readonly _mainBuses = new Set<MainAudioBus>();

    // Owned top-level AbstractAudioSuperNode instances.
    private readonly _superNodes = new Set<AbstractAudioSuperNode>();

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
    public abstract get mainOutput(): AbstractAudioNode;

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
        instances.push(this);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);

    /**
     * Releases associated resources.
     */
    public dispose(): void {
        if (instances.includes(this)) {
            instances.splice(instances.indexOf(this), 1);
        }

        const superNodeIterator = this._superNodes.values();
        for (let next = superNodeIterator.next(); !next.done; next = superNodeIterator.next()) {
            next.value.dispose();
        }

        this._superNodes.clear();
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

        this._addSuperNode(mainBus);
    }

    protected _removeMainBus(mainBus: MainAudioBus): void {
        this._mainBuses.delete(mainBus);
        this._defaultMainBus = null;

        this._removeSuperNode(mainBus);
    }

    protected _addSuperNode(superNode: AbstractAudioSuperNode): void {
        this._superNodes.add(superNode);
    }

    protected _removeSuperNode(superNode: AbstractAudioSuperNode): void {
        this._superNodes.delete(superNode);
    }
}
