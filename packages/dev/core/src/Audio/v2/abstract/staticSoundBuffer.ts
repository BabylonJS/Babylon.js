import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class for static sound buffer.
 */
export abstract class StaticSoundBuffer {
    /**
     * The engine that the sound buffer belongs to.
     */
    public readonly engine: AudioEngineV2;

    protected constructor(engine: AudioEngineV2) {
        this.engine = engine;
    }

    /**
     * The sample rate of the sound buffer.
     */
    public abstract get sampleRate(): number;

    /**
     * The length of the sound buffer, in sample frames.
     */
    public abstract get length(): number;

    /**
     * The duration of the sound buffer, in seconds.
     */
    public abstract get duration(): number;

    /**
     * The number of channels in the sound buffer.
     */
    public abstract get channelCount(): number;
}
