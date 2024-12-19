import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class representing an audio bus node with a volume control.
 */
export abstract class AbstractAudioBus extends AbstractAudioNode {
    /** @internal */
    constructor(name: string, engine: AudioEngineV2) {
        super(engine, AudioNodeType.InputOutput, null, name);
    }
}
