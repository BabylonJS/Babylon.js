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
export abstract class AbstractAudioEngine extends AbstractAudioNodeParent {
    // Owns top-level AbstractAudioNode objects.
    // Owns all AbstractSound objects.

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _mainBuses = new Array<MainAudioBus>();

    // Owned
    private readonly _sounds = new Array<AbstractSound>();

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _soundInstances = new Array<AbstractSoundInstance>();

    /**
     * The spatial audio listeners.
     */
    public readonly listeners = new Array<SpatialAudioListener>(); // Owned

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
        if (this._mainBuses.length === 0) {
            return null;
        }

        return this._mainBuses[0];
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._soundInstances.length = 0;

        if (this.listeners) {
            for (const listener of this.listeners) {
                listener.dispose();
            }
            this.listeners.length = 0;
        }

        for (const source of this._sounds) {
            source.dispose();
        }
        this._sounds.length = 0;
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
        this._mainBuses.push(mainBus);
        mainBus.onDisposeObservable.addOnce(() => {
            const index = this._mainBuses.indexOf(mainBus);
            if (index !== -1) {
                this._mainBuses.splice(index, 1);
            }
        });
    }

    protected _addSound(sound: AbstractSound): void {
        this._sounds.push(sound);
        sound.onDisposeObservable.addOnce(() => {
            const index = this._sounds.indexOf(sound);
            if (index !== -1) {
                this._sounds.splice(index, 1);
            }
        });
    }

    protected _addSoundInstance(soundInstance: AbstractSoundInstance): void {
        this._soundInstances.push(soundInstance);
        soundInstance.onDisposeObservable.addOnce(() => {
            const index = this._soundInstances.indexOf(soundInstance);
            if (index !== -1) {
                this._soundInstances.splice(index, 1);
            }
        });
    }
}
