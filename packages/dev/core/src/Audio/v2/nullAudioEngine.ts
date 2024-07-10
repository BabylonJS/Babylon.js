import { AbstractAudioEngine } from "./audioEngine";
import { NullPhysicalAudioEngine } from "./nullPhysicalAudioEngine";

/**
 * An audio engine that uses no resources and produces no sound.
 */
export class NullAudioEngine extends AbstractAudioEngine {
    /**
     *
     */
    public constructor() {
        super(new NullPhysicalAudioEngine());
    }
}
