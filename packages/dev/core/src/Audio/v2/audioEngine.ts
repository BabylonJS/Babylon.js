import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractAudioNodeParent } from "./abstractAudioNodeParent";
import type { MainAudioBus } from "./mainAudioBus";
import type { AbstractSound } from "./abstractSound";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { SpatialAudioListener } from "./spatialAudioListener";

/**
 * Abstract base class for audio engines.
 */
export abstract class AudioEngineV2 extends AbstractAudioNodeParent {
    // Owns top-level AbstractAudioNode objects.
    // Owns all AbstractSound objects.

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _mainBuses = new Set<MainAudioBus>();

    private _defaultMainBus: Nullable<MainAudioBus> = null;

    // Owned
    private readonly _sounds = new Set<AbstractSound>();

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _soundInstances = new Set<AbstractSoundInstance>();

    /**
     * The spatial audio listeners.
     */
    public readonly listeners = new Set<SpatialAudioListener>(); // Owned

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
    public abstract get mainOutput(): Nullable<AbstractAudioNode>;

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

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._soundInstances.clear();

        if (this.listeners) {
            for (const listener of Array.from(this.listeners)) {
                listener.dispose();
            }
            this.listeners.clear();
        }

        for (const source of Array.from(this._sounds)) {
            source.dispose();
        }
        this._sounds.clear();
    }

    /**
     * Checks if the specified format is valid.
     * @param format The format to check. The format is the audio file extension, such as "mp3" or "wav".
     * @returns `true` if the format is valid; otherwise `false`.
     */
    public abstract formatIsValid(format: string): boolean;

    /**
     * Pauses the audio engine if it is running.
     * @param waitTime The time in seconds to wait before pausing the audio engine.
     * @returns A promise that resolves when the audio engine is paused.
     */
    public abstract pause(waitTime?: Nullable<number>): Promise<void>;

    /**
     * Resumes the audio engine if it is not running.
     * @returns A promise that resolves when the audio engine is running.
     */
    public abstract resume(): Promise<void>;

    protected _addMainBus(mainBus: MainAudioBus): void {
        this._mainBuses.add(mainBus);
        mainBus.onDisposeObservable.addOnce(() => {
            this._mainBuses.delete(mainBus);
        });
    }

    protected _addSound(sound: AbstractSound): void {
        this._sounds.add(sound);
        sound.onDisposeObservable.addOnce(() => {
            this._sounds.delete(sound);
        });
    }

    protected _addSoundInstance(soundInstance: AbstractSoundInstance): void {
        this._soundInstances.add(soundInstance);
        soundInstance.onDisposeObservable.addOnce(() => {
            this._soundInstances.delete(soundInstance);
        });
    }
}
