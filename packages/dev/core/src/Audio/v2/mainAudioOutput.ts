import { _AudioNodeType, AbstractAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class for the main audio output node.
 */
export abstract class MainAudioOutput extends AbstractAudioNode {
    protected constructor(engine: AudioEngineV2) {
        super(engine, _AudioNodeType.Input);
    }
}
