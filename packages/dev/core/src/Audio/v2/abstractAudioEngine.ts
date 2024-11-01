import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractAudioNodeParent } from "./abstractAudioNodeParent";
import type { AudioPositioner } from "./audioPositioner";
import type { AudioSender } from "./audioSender";
import type { MainAudioBus } from "./mainAudioBus";
import type { MainAudioOutput } from "./mainAudioOutput";
import type { AbstractSound } from "./abstractSound";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { StaticSound, StaticSoundOptions } from "./staticSound";
import type { StaticSoundBuffer, StaticSoundBufferOptions } from "./staticSoundBuffer";
import type { StreamingSound, StreamingSoundOptions } from "./streamingSound";
import type { SpatialAudioListener } from "./spatialAudioListener";

/**
 * Abstract base class for audio engines.
 */
export abstract class AbstractAudioEngine extends AbstractAudioNodeParent {
    // Owns top-level AbstractAudioNode objects.
    // Owns all AbstractSound objects.

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _mainBuses = new Set<MainAudioBus>();

    // Owned
    private readonly _sounds = new Set<AbstractSound>();

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _soundInstances = new Set<AbstractSoundInstance>();

    /**
     * The spatial audio listeners.
     */
    public readonly listeners = new Set<SpatialAudioListener>(); // Owned

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

        const [bus] = this._mainBuses;
        return bus;
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._soundInstances.clear();

        if (this.listeners) {
            for (const listener of this.listeners) {
                listener.dispose();
            }
            this.listeners.clear();
        }

        for (const source of this._sounds) {
            source.dispose();
        }
        this._sounds.clear();
    }

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

    public abstract createMainBus(name: string): Promise<MainAudioBus>;
    public abstract createMainOutput(): Promise<MainAudioOutput>;
    public abstract createPositioner(parent: AbstractAudioNode): Promise<AudioPositioner>;
    public abstract createSender(parent: AbstractAudioNode): Promise<AudioSender>;
    public abstract createSound(name: string, options: Nullable<StaticSoundOptions>): Promise<StaticSound>;
    public abstract createSoundBuffer(options: Nullable<StaticSoundBufferOptions>): Promise<StaticSoundBuffer>;
    public abstract createStreamingSound(name: string, options: Nullable<StreamingSoundOptions>): Promise<StreamingSound>;
}
