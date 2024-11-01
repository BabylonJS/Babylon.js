import type { AbstractAudioEngine } from "./abstractAudioEngine";

/**
 * Options for creating a new static sound buffer.
 */
export interface StaticSoundBufferOptions {
    /**
     * The URL of the sound source.
     */
    sourceUrl?: string;
}

/**
 * Abstract class for static sound buffer.
 */
export abstract class StaticSoundBuffer {
    /**
     * The engine that the sound buffer belongs to.
     */
    public readonly engine: AbstractAudioEngine;

    public abstract get sampleRate(): number;
    public abstract get length(): number;
    public abstract get duration(): number;
    public abstract get numberOfChannels(): number;

    /** @internal */
    constructor(engine: AbstractAudioEngine) {
        this.engine = engine;
    }
}
