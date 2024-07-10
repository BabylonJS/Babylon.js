/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

export interface ISound {}

/**
 * Physical.
 */
export interface IAudioSpatializer {
    id: number;
    sounds: Array<ISound>; // TODO: Fix this. ISound is logical, but it's being referenced from physical here.
}

/**
 * Physical.
 */
export interface IAudioBuffer {
    id: number;
}

/**
 * Physical.
 */
export interface IAudioStream {
    id: number;
}

export interface ISpatialSoundOptions {}

export interface ISoundOptions {
    sourceUrl?: string;
    sourceUrls?: string[];

    loop?: boolean;
    priority?: number;
    spatial?: boolean;
    volume?: number;
}

export interface IStaticSoundOptions extends ISoundOptions {
    sourceBuffer?: IAudioBuffer;

    pitch?: number;
    playbackRate?: number;
}

export interface IStreamingSoundOptions extends ISoundOptions {}

/**
 * Physical.
 */
export interface IAudioPhysicalEngine {
    /**
     * Returns a double representing an ever-increasing hardware time in seconds used for scheduling. It starts at 0.
     */
    currentTime: number;

    update(): void;

    createSpatializer(options: ISpatialSoundOptions): IAudioSpatializer;
    createBuffer(options: IStaticSoundOptions): IAudioBuffer;
    createStream(options: IStreamingSoundOptions): IAudioStream;
}

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

export interface IAudioEngine {
    readonly currentTime: number;

    update(): void;
}

export class AbstractAudioEngine implements IAudioEngine {
    public readonly physicalEngine: IAudioPhysicalEngine;

    public constructor(physicalEngine: IAudioPhysicalEngine) {
        this.physicalEngine = physicalEngine;
    }

    /**
     * Returns the current time in seconds.
     */
    public get currentTime(): number {
        return this.physicalEngine.currentTime;
    }

    /**
     * Updates audio engine control rate (k-rate) settings. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        this.physicalEngine.update();
    }
}

export class AbstractPhysicalAudioEngine {
    protected get _nextSpatializerId(): number {
        return 0;
    }

    protected get _nextBufferId(): number {
        return 0;
    }

    protected get _nextStreamId(): number {
        return 0;
    }
}
