import type { AbstractAudioDevice } from "./abstractAudioDevice";
import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractAudioNodeParent } from "./abstractAudioNodeParent";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractMainAudioBus } from "./abstractMainAudioBus";
import type { AbstractSound } from "./abstractSound";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractStaticSound, IStaticSoundOptions } from "./abstractStaticSound";
import type { AbstractStaticSoundInstance } from "./abstractStaticSoundInstance";
import type { AbstractStreamingSound, IStreamingSoundOptions } from "./abstractStreamingSound";
import type { AbstractStreamingSoundInstance } from "./abstractStreamingSoundInstance";
import type { SpatialAudioListener } from "./spatialAudioListener";

/**
 * Owns top-level AbstractAudioNode objects.
 * Owns all AbstractSound objects.
 */
export abstract class AbstractAudioEngine extends AbstractAudioNodeParent {
    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _devices = new Set<AbstractAudioDevice>();

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _mainBuses = new Set<AbstractMainAudioBus>();

    // Owned
    private readonly _sounds = new Set<AbstractSound>();

    // Not owned, but all items should be in parent's `children` container, too, which is owned.
    private readonly _soundInstances = new Set<AbstractSoundInstance>();

    // Owned
    public readonly listeners = new Set<SpatialAudioListener>();

    public get defaultDevice() {
        const [device] = this._devices;
        return device;
    }

    public get defaultMainBus(): AbstractMainAudioBus {
        const [bus] = this._mainBuses;
        return bus;
    }

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

    protected _addDevice(device: AbstractAudioDevice): void {
        this._devices.add(device);
        device.onDisposeObservable.addOnce(() => {
            this._devices.delete(device);
        });
    }

    protected _addMainBus(mainBus: AbstractMainAudioBus): void {
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

    public abstract createDevice(name: string): Promise<AbstractAudioDevice>;
    public abstract createMainBus(name: string): Promise<AbstractMainAudioBus>;
    public abstract createPositioner(parent: AbstractAudioNode): Promise<AbstractAudioPositioner>;
    public abstract createSender(parent: AbstractAudioNode): Promise<AbstractAudioSender>;
    public abstract createSound(name: string, options?: IStaticSoundOptions): Promise<AbstractStaticSound>;
    public abstract createSoundInstance(source: AbstractStaticSound): Promise<AbstractStaticSoundInstance>;
    public abstract createStreamingSound(name: string, options?: IStreamingSoundOptions): Promise<AbstractStreamingSound>;
    public abstract createStreamingSoundInstance(source: AbstractStreamingSound): Promise<AbstractStreamingSoundInstance>;
}
