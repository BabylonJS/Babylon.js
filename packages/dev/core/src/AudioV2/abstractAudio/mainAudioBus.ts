import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { IAbstractAudioBusOptions } from "./abstractAudioBus";

/**
 * Options for creating a main audio bus.
 */
export interface IMainAudioBusOptions extends IAbstractAudioBusOptions {}

/**
 * Abstract class representing a main audio bus.
 *
 * Main audio buses are the last bus in the audio graph.
 *
 * Unlike {@link AudioBus} instances, `MainAudioBus` instances have no spatial audio and stereo output capabilities,
 * and they cannot be connected downstream to another audio bus. They only connect downstream to the audio engine's
 * main output.
 *
 * Main audio buses are created by the {@link CreateMainAudioBusAsync} function.
 */
export abstract class MainAudioBus extends AbstractAudioBus {
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }
}
