/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { ISoundSourceOptions } from "./abstractSoundSource";
import { AbstractSoundSource } from "./abstractSoundSource";

export interface IStaticSoundSourceOptions extends ISoundSourceOptions {
    loopStart?: number;
    loopEnd?: number;
}

export abstract class AbstractStaticSoundSource extends AbstractSoundSource {
    private _loopStart: number;
    private _loopEnd: number;

    public constructor(name: string, engine: AbstractAudioEngine, options?: IStaticSoundSourceOptions) {
        super(name, engine, options);

        this._loopStart = options?.loopStart ?? 0;
        this._loopEnd = options?.loopEnd ?? 0;
    }

    public get loopStart(): number {
        return this._loopStart;
    }

    public set loopStart(value: number) {
        this._loopStart = value;
    }

    public get loopEnd(): number {
        return this._loopEnd;
    }

    public set loopEnd(value: number) {
        this._loopEnd = value;
    }

    protected _createSoundInstance(inputNode: AbstractAudioNode): AbstractSoundInstance {
        return this.engine.createStaticSoundInstance(this, inputNode);
    }
}
