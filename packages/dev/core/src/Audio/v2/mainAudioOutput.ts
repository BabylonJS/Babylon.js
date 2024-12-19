import type { AudioEngineV2 } from "./audioEngineV2";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";

/**
 * Abstract class for the main audio output node.
 */
export abstract class MainAudioOutput extends AbstractAudioNode {
    protected constructor(engine: AudioEngineV2) {
        super(engine, AudioNodeType.Input);
    }
}
