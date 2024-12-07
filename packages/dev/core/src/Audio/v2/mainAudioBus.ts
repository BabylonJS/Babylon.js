import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class representing the main audio bus in the audio engine.
 */
export abstract class MainAudioBus extends AbstractAudioBus {
    /** @internal */
    constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }
}
