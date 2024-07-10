/** @internal */
export interface IAudioPhysicalEngine {
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
     * Update the audio engine automatically. Defaults to `true`.
     */
    autoUpdate?: boolean;

    /**
     * The automatic update rate in milliseconds. Defaults to 50. Ignored if `autoUpdate` is `false`.
     */
    autoUpdateRate?: number;

    /**
     * The maximum number of simultaneously playing spatial voices. Defaults to 64.
     */
    maxSpatialVoices?: number;

    /**
     * The maximum number of simultaneously playing static voices. Defaults to 128.
     */
    maxStaticVoices?: number;

    /**
     * The maximum number of simultaneously playing streaming voices. Defaults to 8.
     */
    maxStreamingVoices?: number;
}

/** @internal */
export class AbstractAudioEngine {
    protected _physicalEngine: IAudioPhysicalEngine;

    /** @internal */
    public constructor(physicalEngine: IAudioPhysicalEngine) {
        this._physicalEngine = physicalEngine;
    }

    /**
     * Returns the current time in seconds.
     */
    public get currentTime(): number {
        return this._physicalEngine.currentTime;
    }

    /**
     * Updates audio engine control rate (k-rate) settings. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        this._physicalEngine.update();
    }
}
