import type { AbstractWebAudioEngine } from "./webAudio/webAudioEngine";

/**
 * Options for creating a new static sound buffer.
 */
export interface AbstractStaticSoundBufferOptions {
    /**
     * The URL of the sound source.
     */
    sourceUrl?: string;
}

/**
 * Abstract class for static sound buffer.
 */
export abstract class AbstractStaticSoundBuffer {
    /**
     * The engine that the sound buffer belongs to.
     */
    public readonly engine: AbstractWebAudioEngine;

    public abstract get sampleRate(): number;
    public abstract get length(): number;
    public abstract get duration(): number;
    public abstract get numberOfChannels(): number;

    /** @internal */
    constructor(engine: AbstractWebAudioEngine) {
        this.engine = engine;
    }
}
