import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";

/** */
export interface IMainAudioBusOptions extends IVolumeAudioOptions {}

/**
 * Abstract class representing a main audio bus.
 *
 * Main audio buses are created by the {@link CreateMainAudioBusAsync} function.
 *
 * Main audio buses are the last bus in the audio graph.
 *
 * Unlike {@link AudioBus} instances, `MainAudioBus` instances have no spatial audio and stereo output capabilities,
 * and they cannot be connected downstream to another audio bus. They only connect downstream to the audio engine's
 * main output.
 */
export abstract class MainAudioBus extends AbstractAudioBus {
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }
}
