import type { Nullable } from "../../types";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAudioSuperNode } from "./abstractAudioSuperNode";

/** */
export abstract class AbstractAudioSubNode extends AbstractAudioNode {
    /** @internal */
    constructor(name: string, owner: AbstractAudioSuperNode) {
        super(owner.engine, AudioNodeType.InputOutput, owner, name);
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
