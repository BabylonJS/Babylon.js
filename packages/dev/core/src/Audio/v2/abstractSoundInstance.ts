/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSoundSource } from "./abstractSoundSource";

export abstract class AbstractSoundInstance extends AbstractAudioNode {
    public constructor(source: AbstractSoundSource) {
        super(source.engine, AudioNodeType.Output);

        this._source = source;
    }

    protected _source: AbstractSoundSource;

    public abstract get currentTime(): number;

    public abstract play(): void;
    public abstract pause(): void;
    public abstract resume(): void;

    public stop(): void {
        this._onEnded();
    }

    protected _onEnded(): void {
        this._source._onSoundInstanceEnded(this);
    }
}
