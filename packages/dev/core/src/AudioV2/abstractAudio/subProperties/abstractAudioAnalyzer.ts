// eslint-disable-next-line @typescript-eslint/naming-convention
export type AudioAnalyzerFFTSizeType = 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768;

export const _AudioAnalyzerDefaults = {
    fftSize: 2048 as AudioAnalyzerFFTSizeType,
    minDecibels: -100 as number,
    maxDecibels: -30 as number,
    smoothing: 0.8 as number,
} as const;

/**
 * Options for the AudioAnalyzer
 */
export interface IAudioAnalyzerOptions {
    /**
     * Enable the audio analyzer. Defaults to false.
     */
    analyzerEnabled: boolean;
    /**
     * The size of the FFT (fast fourier transform) to use when converting time-domain data to frequency-domain data. Default is 2048.
     */
    analyzerFFTSize: AudioAnalyzerFFTSizeType;

    /**
     * The minimum decibel value for the range of the analyzer. Default is -100.
     */
    analyzerMinDecibels: number;

    /**
     * The maximum decibel value for the range of the analyzer. Default is -30.
     */
    analyzerMaxDecibels: number;

    /**
     * A number between 0 and 1 that determines how quickly the analyzer's value changes. Default is 0.8.
     */
    analyzerSmoothing: number;
}

/**
 * @param options The audio analyzer options to check.
 * @returns `true` if audio analyzer options are defined, otherwise `false`.
 */
export function _HasAudioAnalyzerOptions(options: Partial<IAudioAnalyzerOptions>): boolean {
    return (
        options.analyzerEnabled ||
        options.analyzerFFTSize !== undefined ||
        options.analyzerMinDecibels !== undefined ||
        options.analyzerMaxDecibels !== undefined ||
        options.analyzerSmoothing !== undefined
    );
}

/**
 * An AudioAnalyzer converts time-domain audio data into the frequency-domain.
 */
export abstract class AbstractAudioAnalyzer {
    /**
     * The size of the FFT (fast fourier transform) to use when converting time-domain data to frequency-domain data. Default is 2048.
     */
    public abstract fftSize: AudioAnalyzerFFTSizeType;

    /**
     * The number of data values that will be returned when calling getByteFrequencyData() or getFloatFrequencyData(). This is always half the `fftSize`.
     */
    public get frequencyBinCount(): number {
        return this.fftSize / 2;
    }

    /**
     * Whether the analyzer is enabled or not.
     * - The `getByteFrequencyData` and `getFloatFrequencyData` functions return `null` if the analyzer is not enabled.
     * @see {@link enableAsync}
     */
    public abstract isEnabled: boolean;

    /**
     * The minimum decibel value for the range of the analyzer. Default is -100.
     */
    public abstract minDecibels: number;

    /**
     * The maximum decibel value for the range of the analyzer. Default is -30.
     */
    public abstract maxDecibels: number;

    /**
     * A number between 0 and 1 that determines how quickly the analyzer's value changes. Default is 0.8.
     */
    public abstract smoothing: number;

    /**
     * Releases associated resources.
     */
    public abstract dispose(): void;

    /**
     * Enables the analyzer
     */
    public abstract enableAsync(): Promise<void>;

    /**
     * Gets the current frequency data as a byte array
     * @returns a Uint8Array if the analyzer is enabled, otherwise `null`
     */
    public abstract getByteFrequencyData(): Uint8Array;

    /**
     * Gets the current frequency data as a float array
     * @returns a Float32Array if the analyzer is enabled, otherwise `null`
     */
    public abstract getFloatFrequencyData(): Float32Array;
}
