/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractPrimaryAudioBus } from "./abstractAudioBus";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractSoundSource } from "./abstractSoundSource";
import { SoundState } from "./soundState";
import type { Nullable } from "../../types";

export interface ISoundObjectOptions {
    autoplay?: boolean;
    enablePositioner?: boolean;
    loop?: boolean;
    pitch?: number;
    startTime?: number;
    stopTime?: number;
    volume?: number;
}

export abstract class AbstractSoundObject extends AbstractNamedAudioNode {
    private _outputBus: Nullable<AbstractPrimaryAudioBus> = null;
    private _positioner: Nullable<AbstractAudioPositioner> = null;
    private _soundSources = new Set<AbstractSoundSource>();

    public readonly autoplay: boolean;
    public loop: boolean;
    public pitch: number;
    public startTime: number;
    public stopTime: number;
    public volume: number;

    public readonly sender: AbstractAudioSender;

    public constructor(name: string, engine: AbstractAudioEngine, options?: ISoundObjectOptions) {
        super(name, engine, AudioNodeType.InputOutput);

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.pitch = options?.pitch ?? 0;
        this.startTime = options?.startTime ?? 0;
        this.stopTime = options?.stopTime ?? 0;
        this.volume = options?.volume ?? 1;

        if (options?.enablePositioner) {
            this.enablePositioner();
        }

        this.sender = engine.createSender(this);
    }

    public override dispose(): void {
        this.stop();

        this._outputBus = null;

        this._positioner?.dispose();
        this._positioner = null;

        this._soundSources.clear();
    }

    public get positioner(): Nullable<AbstractAudioPositioner> {
        return this._positioner;
    }

    public enablePositioner() {
        if (this._positioner) {
            return;
        }

        this._positioner = this.engine.createPositioner(this);
    }

    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

    public setOutputBus(outputBus: Nullable<AbstractPrimaryAudioBus>) {
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

    public get soundSources(): IterableIterator<AbstractSoundSource> {
        return this._soundSources.values();
    }

    public addSoundSource(soundSource: AbstractSoundSource): void {
        this._soundSources.add(soundSource);
    }

    public removeSoundSource(soundSource: AbstractSoundSource): void {
        this._soundSources.delete(soundSource);
    }

    private _state: SoundState = SoundState.Stopped;

    public play(): void {
        if (this._state === SoundState.Playing) {
            return;
        }
        if (this._state === SoundState.Paused) {
            this.resume();
            return;
        }

        for (const source of this._soundSources) {
            source.play(this);
        }

        this._state = SoundState.Playing;
    }

    public pause(): void {
        if (this._state !== SoundState.Playing) {
            return;
        }

        for (const source of this._soundSources) {
            source.pause();
        }

        this._state = SoundState.Paused;
    }

    public resume(): void {
        if (this._state !== SoundState.Paused) {
            return;
        }

        for (const source of this._soundSources) {
            source.resume();
        }

        this._state = SoundState.Playing;
    }

    public stop(): void {
        if (this._state === SoundState.Stopped) {
            return;
        }

        for (const source of this._soundSources) {
            source.stop();
        }

        this._state = SoundState.Stopped;
    }
}
