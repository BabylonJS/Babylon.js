/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { ISoundSourceOptions } from "./abstractSoundSource";
import { AbstractSoundSource } from "./abstractSoundSource";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

export interface IStreamingSoundSourceOptions extends ISoundSourceOptions {
    preload?: StreamingSoundPreloadType;
}

export abstract class AbstractStreamingSoundSource extends AbstractSoundSource {
    public constructor(name: string, engine: AbstractAudioEngine, options?: IStreamingSoundSourceOptions) {
        super(name, engine, options);

        this._preload = options?.preload ?? "auto";
    }

    private _preload: StreamingSoundPreloadType = "auto";

    public get preload(): StreamingSoundPreloadType {
        return this._preload;
    }

    public set preload(preload: StreamingSoundPreloadType) {
        if (this._preload === preload) {
            return;
        }

        this._preload = preload;
    }

    protected _createSoundInstance(): AbstractSoundInstance {
        return this.engine.createStreamingSoundInstance(this);
    }
}
