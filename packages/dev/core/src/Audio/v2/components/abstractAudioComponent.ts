import type { Nullable } from "../../../types";
import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import { AbstractAudioNode, AudioNodeType } from "../abstractAudioNode";

/** */
export abstract class AbstractAudioComponent extends AbstractAudioNode {
    /** @internal */
    constructor(owner: AbstractAudioComponentOwner) {
        super(owner.engine, AudioNodeType.InputOutput, owner);
    }

    /** @internal */
    public abstract _getComponentTypeName(): string;

    /** @internal */
    public connect(node: AbstractAudioNode): void {
        this._connect(node);
    }

    /** @internal */
    public disconnect(node: Nullable<AbstractAudioNode> = null): void {
        if (node) {
            this._disconnect(node);
        } else {
            for (const node of this._connectedDownstreamNodes!) {
                this._disconnect(node);
            }
        }
    }
}
