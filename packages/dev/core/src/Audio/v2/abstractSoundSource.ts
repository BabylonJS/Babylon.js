/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { Nullable } from "../../types";
import type { IDisposable } from "../../scene";

export interface ISoundSourceOptions {
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
export abstract class AbstractSoundSource implements IDisposable {
    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<ISoundSourceOptions> = null) {
        this.name = name;
        this.engine = engine;

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.pitch = options?.pitch ?? 0;
        this.startTime = options?.startTime ?? 0;
        this.stopTime = options?.stopTime ?? 0;
        this.volume = options?.volume ?? 1;

        this.engine._addSoundSource(this);
    }

    public dispose(): void {
        this.stop();

        if (this._soundInstances) {
            this._soundInstances.length = 0;
        }

        this.engine._removeSoundSource(this);
    }

    public name: string;
    public readonly engine: AbstractAudioEngine;

    public readonly autoplay: boolean;
    public loop: boolean;
    public pitch: number;
    public startTime: number;
    public stopTime: number;
    public volume: number;

    public abstract get currentTime(): number;

    // Does not indicate ownership.
    protected _soundInstances: Nullable<Array<AbstractSoundInstance>> = null;

    public get soundInstances(): Nullable<ReadonlyArray<AbstractSoundInstance>> {
        return this._soundInstances;
    }

    public play(inputNode: AbstractAudioNode): AbstractSoundInstance {
        const instance = this._createSoundInstance(inputNode);
        this._getSoundInstances().push(instance);

        instance.play();

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

    protected abstract _createSoundInstance(inputNode: AbstractAudioNode): AbstractSoundInstance;

    public _onSoundInstanceEnded(instance: AbstractSoundInstance): void {
        const index = this._getSoundInstances().indexOf(instance);
        if (index < 0) {
            return;
        }

        this._getSoundInstances().splice(index, 1);
    }

    private _getSoundInstances(): Array<AbstractSoundInstance> {
        if (!this._soundInstances) {
            this._soundInstances = new Array<AbstractSoundInstance>();
        }

        return this._soundInstances;
    }
}
