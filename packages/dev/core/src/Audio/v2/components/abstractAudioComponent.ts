import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import { AbstractAudioNode, AudioNodeType } from "../abstractAudioNode";

/** */
export abstract class AbstractAudioComponent extends AbstractAudioNode {
    /** @internal */
    constructor(owner: AbstractAudioComponentOwner) {
        super(owner.engine, AudioNodeType.InputOutput, owner);
    }

    /** @internal */
    public abstract _getComponentClassName(): string;
}
