/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSoundSource } from "./abstractSoundSource";

/**
 * Owned by AbstractAudioEngine.
 * Output-only node that connects to a downstream input node.
 */
export abstract class AbstractSoundInstance extends AbstractAudioNode {
    public constructor(source: AbstractSoundSource, inputNode: AbstractAudioNode) {
        super(source.engine, AudioNodeType.Output);

        this.engine._addSoundInstance(this);

        this._source = source;

        this._connect(inputNode);
    }

    public override dispose(): void {
        this.stop();

        this.engine._removeSoundInstance(this);

        super.dispose();
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
