import { AudioNodeType, AbstractAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class for the main audio output node.
 *
 * A main audio output is the last audio node in the audio graph before the audio is sent to the speakers.
 *
 * @see {@link AudioEngineV2.mainOut}
 * @internal
 */
export abstract class _MainAudioOut extends AbstractAudioNode {
    protected constructor(engine: AudioEngineV2) {
        super(engine, AudioNodeType.HAS_INPUTS);
    }
}
