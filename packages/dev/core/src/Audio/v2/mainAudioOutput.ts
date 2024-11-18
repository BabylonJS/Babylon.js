import type { AudioEngineV2 } from "./audioEngine";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";

/**
 * Abstract class for the main audio output node.
 */
export abstract class MainAudioOutput extends AbstractAudioNode {
    /** @internal */
    constructor(engine: AudioEngineV2) {
        super(engine, AudioNodeType.Input);
    }
}
