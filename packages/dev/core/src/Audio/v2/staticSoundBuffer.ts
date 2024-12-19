import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class for static sound buffer.
 */
export abstract class StaticSoundBuffer {
    /**
     * The engine that the sound buffer belongs to.
     */
    public readonly engine: AudioEngineV2;

    public abstract get sampleRate(): number;
    public abstract get length(): number;
    public abstract get duration(): number;
    public abstract get numberOfChannels(): number;

    protected constructor(engine: AudioEngineV2) {
        this.engine = engine;
    }
}
