import type { Nullable } from "../../types";
import type { AbstractPrimaryAudioBus } from "./abstractAudioBus";
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

    outputBus?: AbstractPrimaryAudioBus;
}

/**
 * Owned by AbstractAudioEngine.
 */
export abstract class AbstractSound extends AbstractNamedAudioNode {
    // Non-owning.
    protected _soundInstances = new Set<AbstractSoundInstance>();

    protected _outputBus: Nullable<AbstractPrimaryAudioBus>;

    public readonly autoplay: boolean;
    public loop: boolean;
    public pitch: number;
    public startTime: number;
    public stopTime: number;
    public volume: number;

    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

    public set outputBus(outputBus: Nullable<AbstractPrimaryAudioBus>) {
        if (this._outputBus === outputBus) {
            return;
        }

        if (this._outputBus) {
            this._disconnect(this._outputBus);
        }

        this._outputBus = outputBus;

        if (this._outputBus) {
            this._connect(this._outputBus);
        }
    }

    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<ISoundOptions> = null) {
        super(name, engine, AudioNodeType.Output);

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.pitch = options?.pitch ?? 0;
        this.startTime = options?.startTime ?? 0;
        this.stopTime = options?.stopTime ?? 0;
        this.volume = options?.volume ?? 1;

        this.outputBus = options?.outputBus ?? engine.defaultMainBus;
    }

    public override dispose(): void {
        super.dispose();

        this.stop();

        this._outputBus = null;
        this._soundInstances.clear();

        this.onDisposeObservable.notifyObservers(this);
    }

    protected abstract _createSoundInstance(): Promise<AbstractSoundInstance>;

    public async play(): Promise<AbstractSoundInstance> {
        const instance = await this._createSoundInstance();

        await instance.play();

        this._soundInstances.add(instance);

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
        this._soundInstances.delete(instance);
    }
}
