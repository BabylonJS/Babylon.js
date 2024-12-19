import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";

/** @internal */
export abstract class AbstractAudioSubNode extends AbstractAudioNode {
    /** @internal */
    protected constructor(name: string, parent: AbstractAudioNode) {
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
