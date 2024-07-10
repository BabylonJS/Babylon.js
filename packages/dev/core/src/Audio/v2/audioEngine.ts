/** @internal */
export interface IPhysicalAudioEngineOptions {
    /**
     * The maximum number of simultaneously playing voices.
     */
    maxVoices?: number;
}

/** @internal */
export interface IPhysicalAudioEngine {
    /**
     * Returns a double representing an ever-increasing hardware time in seconds used for scheduling. It starts at 0.
     */
    currentTime: number;

    /**
     *
     */
    update(): void;
}

/**
 *
 */
export interface IAudioEngineOptions {
    /**
     * The update rate in milliseconds.
     */
    updateRate?: number;

    /**
     * The maximum number of simultaneously playing voices.
     */
    maxVoices?: number;
}

/** @internal */
export class AbstractAudioEngine {
    protected _physicalAudioEngine: IPhysicalAudioEngine;

    /** @internal */
    public constructor(physicalAudioEngine: IPhysicalAudioEngine) {
        this._physicalAudioEngine = physicalAudioEngine;
    }

    /**
     * Returns the current time in seconds.
     */
    public get currentTime(): number {
        return this._physicalAudioEngine.currentTime;
    }

    /**
     * Updates the audio engine.
     *
     * Should be called multiple times per second.
     */
    public update(): void {
        this._physicalAudioEngine.update();
    }
}
