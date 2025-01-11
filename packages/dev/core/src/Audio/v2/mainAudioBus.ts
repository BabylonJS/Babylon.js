import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";

/** */
export interface IMainAudioBusOptions extends IVolumeAudioOptions {}

/**
 * Abstract class representing a main audio bus.
 */
export abstract class MainAudioBus extends AbstractAudioBus {
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }
}
