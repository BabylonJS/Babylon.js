import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";

/**
 * Abstract class for the main audio output node.
 */
export abstract class MainAudioOutput extends AbstractAudioNode {
    /** @internal */
    constructor(engine: AbstractAudioEngine) {
        super(engine, AudioNodeType.Input);
    }
}
