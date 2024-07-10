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
     * Update the audio engine automatically. Defaults to `true`.
     */
    autoUpdate?: boolean;

    /**
     * The automatic update rate in milliseconds. Defaults to 50. Ignored if `autoUpdate` is `false`.
     */
    autoUpdateRate?: number;

    /**
     * The maximum number of simultaneously playing voices. Defaults to 192.
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
     * Updates audio engine control rate (k-rate) settings. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        this._physicalAudioEngine.update();
    }
}
