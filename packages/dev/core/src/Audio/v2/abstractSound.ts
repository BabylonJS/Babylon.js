import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSoundInstance } from "./abstractSoundInstance";

export interface ISoundOptions {
    autoplay?: boolean;
    loop?: boolean;
    pitch?: number;
    startTime?: number;
    stopTime?: number;
    volume?: number;
}

/**
 * Owned by AbstractAudioEngine.
 */
export abstract class AbstractSound extends AbstractNamedAudioNode {
    // Non-owning.
    protected _soundInstances: Nullable<Set<AbstractSoundInstance>> = null;

    public readonly autoplay: boolean;
    public loop: boolean;
    public pitch: number;
    public startTime: number;
    public stopTime: number;
    public volume: number;

    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<ISoundOptions> = null) {
        super(name, engine, AudioNodeType.Output);

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.pitch = options?.pitch ?? 0;
        this.startTime = options?.startTime ?? 0;
        this.stopTime = options?.stopTime ?? 0;
        this.volume = options?.volume ?? 1;

        // this.engine.sounds.add(this);
    }

    public override dispose(): void {
        super.dispose();

        this.stop();

        this._soundInstances?.clear();

        this.onDisposeObservable.notifyObservers(this);
    }

    public abstract get currentTime(): number;

    public get soundInstances(): Nullable<IterableIterator<AbstractSoundInstance>> {
        return this._soundInstances?.values() ?? null;
    }

    protected abstract _createSoundInstance(): Promise<AbstractSoundInstance>;

    public async play(): Promise<AbstractSoundInstance> {
        const instance = await this._createSoundInstance();

        instance.play();

        this._getSoundInstances().add(instance);

        return instance;
    }

    public pause(): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of this._soundInstances) {
            instance.pause();
        }
    }

    public resume(): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of this._soundInstances) {
            instance.resume();
        }
    }

    public stop(): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of this._soundInstances) {
            instance.stop();
        }
    }

    /** @internal */
    public _onSoundInstanceEnded(instance: AbstractSoundInstance): void {
        this._getSoundInstances().delete(instance);
    }

    private _getSoundInstances(): Set<AbstractSoundInstance> {
        if (!this._soundInstances) {
            this._soundInstances = new Set<AbstractSoundInstance>();
        }

        return this._soundInstances;
    }
}
