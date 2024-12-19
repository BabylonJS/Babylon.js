import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { IAudioParentNode } from "./audioParentNode";

/** @internal */
export abstract class AbstractAudioSubNode extends AbstractAudioNode {
    /** @internal */
    protected constructor(name: string, parent: IAudioParentNode) {
        super(parent.engine, AudioNodeType.InputOutput, parent, name);
    }

    /** @internal */
    public connect(node: AbstractAudioNode): void {
        this._connect(node);
    }

    /** @internal */
    public disconnect(node: AbstractAudioNode): void {
        this._disconnect(node);
    }
}
