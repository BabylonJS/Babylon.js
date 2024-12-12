import type { Nullable } from "../../../types";
import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import { AbstractAudioNode, AudioNodeType } from "../abstractAudioNode";

/** */
export abstract class AbstractAudioComponent extends AbstractAudioNode {
    /** @internal */
    public readonly name: string;

    /** @internal */
    constructor(name: string, owner: AbstractAudioComponentOwner) {
        super(owner.engine, AudioNodeType.InputOutput, owner);
        this.name = name;
    }

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
