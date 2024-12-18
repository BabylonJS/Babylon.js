import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { IAudioParentNode } from "./audioParentNode";

/** @internal */
export abstract class AbstractAudioSubNode extends AbstractAudioNode {
    /** @internal */
    constructor(name: string, parent: IAudioParentNode) {
        super(parent.engine, AudioNodeType.InputOutput, parent, name);
    }
}
