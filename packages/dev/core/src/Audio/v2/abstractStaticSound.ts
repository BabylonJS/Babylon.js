import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AbstractSoundInstance } from "./abstractSoundInstance";

export interface IStaticSoundOptions extends ISoundOptions {
    loopStart?: number;
    loopEnd?: number;
}

export abstract class AbstractStaticSound extends AbstractSound {
    private _loopStart: number;
    private _loopEnd: number;

    public constructor(name: string, engine: AbstractAudioEngine, options?: IStaticSoundOptions) {
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

    protected async _createSoundInstance(): Promise<AbstractSoundInstance> {
        return this.engine.createSoundInstance(this);
    }
}
