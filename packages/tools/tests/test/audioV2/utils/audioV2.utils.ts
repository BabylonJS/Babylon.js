import type { Nullable } from "@dev/core/types";
import { expect, test, Page, TestInfo } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

export type AudioContextType = "Realtime" | "Offline";
export type AudioNodeType = "AudioBus" | "AudioEngineV2" | "MainAudioBus" | "SoundSource" | "StaticSound" | "StreamingSound";
export type SoundType = "StaticSound" | "StreamingSound";

export const enum Channel {
    /** Left speaker channel */
    L = 0,
    /** Right speaker channel */
    R = 1,
}

/** The number of decimal places used for volume comparisons using `expect(...).toBeCloseTo(...)`. */
export const VolumePrecision = 1;

/** The range of acceptable volume values for realtime audio tests. */
const RealtimeVolumeRange = 0.2;

export class AudioTestConfig {
    public baseUrl = getGlobalConfig().baseUrl;
    public soundsUrl = getGlobalConfig().assetsUrl + "/sound/testing/audioV2/";

    public defaultOfflineContextDuration = 10;

    public formatAc3SoundFile = "../ac3.ac3";
    public formatMp3SoundFile = "../mp3.mp3";
    public formatOggSoundFile = "../ogg.ogg";
    public hashedSoundFile = "pulsed#2.mp3";
    public pulsed1CountSoundFile = "pulsed-1.mp3";
    public pulsed3CountHalfSpeedSoundFile = "pulsed-3-count--1-second-each--0.5-speed.mp3";
    public pulsed3CountSoundFile = "pulsed-3-count--1-second-each.mp3";
    public pulseTrainSoundFile = "square-1-khz-0.1-amp-for-10-seconds.flac";
}

export class AudioTestResult {
    public length: number = 0;
    public numberOfChannels: number = 0;
    public sampleRate: number = 0;
    public samples: Nullable<Float32Array[]> = null;
    public volumeCurves: Nullable<Float32Array[]> = null;
}

// Declarations for babylonServer/public/audiov2-test.js
declare global {
    let audioContext: AudioContext | OfflineAudioContext;
    let audioTestConfig: AudioTestConfig;
    let audioTestResult: AudioTestResult;
    let errorMessage: string;

    class AudioV2Test {
        public static AfterEach(): void;
        public static BeforeEach(): void;
        public static CreateAbstractSoundAndOutputNodeAsync(
            audioNodeType: AudioNodeType,
            source: string | string[],
            options?: Partial<BABYLON.IStaticSoundOptions | BABYLON.IStreamingSoundOptions> | Partial<BABYLON.IAudioBusOptions>
        ): Promise<{
            sound: { play(): void; stop(): void };
            outputNode: {
                spatial: BABYLON.AbstractSpatialAudio;
                stereo: BABYLON.AbstractStereoAudio;
                volume: number;
                setVolume: (value: number, options?: Partial<BABYLON.IAudioParameterRampOptions>) => void;
            };
        }>;
        public static CreateAbstractSoundAsync(
            soundType: SoundType,
            source: string | string[],
            options?: Partial<BABYLON.IStaticSoundOptions | BABYLON.IStreamingSoundOptions>
        ): Promise<BABYLON.AbstractSound>;
        public static CreateAudioEngineAsync(
            contextType?: AudioContextType | AudioNodeType | SoundType,
            duration?: number,
            options?: Partial<BABYLON.IWebAudioEngineOptions>
        ): Promise<BABYLON.AudioEngineV2>;
        public static CreateBusAsync(options?: Partial<BABYLON.IAudioBusOptions>): Promise<BABYLON.AudioBus>;
        public static CreateSoundAsync(source: string | string[] | BABYLON.StaticSoundBuffer, options?: Partial<BABYLON.IStaticSoundOptions>): Promise<BABYLON.StaticSound>;
        public static CreateSoundSourceAsync(source: string, options?: Partial<BABYLON.ISoundSourceOptions>): Promise<BABYLON.AbstractSoundSource>;
        public static CreateStreamingSoundAsync(source: string | string[], options?: Partial<BABYLON.IStreamingSoundOptions>): Promise<BABYLON.StreamingSound>;
        public static GetErrorMessageAsync(): Promise<string>;
        public static GetPulseCountsAsync(): Promise<number[][]>;
        public static GetResultAsync(): Promise<AudioTestResult>;
        public static GetVolumesAtTimeAsync(time: number): Promise<number[]>;
        public static WaitAsync(seconds: number, callback?: () => void): Promise<void>;
        public static WaitForParameterRampDurationAsync(callback?: () => void): Promise<void>;
    }
}

export const InitAudioV2Tests = () => {
    test.beforeEach(async ({ page }) => {
        await page.route("http://run.test/script.html", async (route) => {
            route.fulfill({
                status: 200,
                contentType: "text/html",
                body: `
                <script src="${getGlobalConfig().baseUrl}/babylon.js"></script>
                <script src="${getGlobalConfig().baseUrl}/audiov2-test.js"></script>
                <body>
                </body>
            `,
            });
        });

        await page.goto("http://run.test/script.html");

        await page.waitForFunction(() => {
            return window.BABYLON && AudioV2Test;
        });

        page.setDefaultTimeout(0);

        await page.evaluate(
            async ({ config }: { config: AudioTestConfig }) => {
                audioTestConfig = config;
            },
            { config: new AudioTestConfig() }
        );

        await page.evaluate(() => {
            AudioV2Test.BeforeEach();
        });
    });

    test.afterEach(async ({ page }) => {
        if (test.info().status === "failed") {
            let result = await page.evaluate(async () => {
                return await AudioV2Test.GetResultAsync();
            });

            SaveAudioTestResult(test.info(), result);
        }

        await page.evaluate(() => {
            AudioV2Test.AfterEach();
        });

        await page.close();
    });
};

export async function EvaluateErrorMessageAsync(page: Page): Promise<string> {
    return await page.evaluate(async () => {
        return await AudioV2Test.GetErrorMessageAsync();
    });
}

/**
 * Gets the pulse counts of the given result's samples.
 *
 * Consecutive pulses are counted as a group, with the number of pulses in the group being the count. The group is
 * ended when a silence of at least `PulseGapLengthThresholdInMilliseconds` is detected or the end of the captured
 * audio is reached.
 *
 * For example, the shape of the returned pulse count arrays for a test result containing 2 channels with 3 groups of
 * pulses detected as 5 pulses in the first group, 6 in the second and 7 in the third group, would look like this:
 * [[5, 6, 7], [5, 6, 7]] ... assuming both test result channels contain the same audio output, which is typical.
 *
 * @returns an array containing the pulse counts for each channel in the given result's samples
 */
export async function EvaluatePulseCountsAsync(page: Page, testFn: () => Promise<void>): Promise<number[][]> {
    await page.evaluate(testFn);
    return await page.evaluate(async () => {
        return await AudioV2Test.GetPulseCountsAsync();
    });
}

/**
 * Gets the volumes of the audio test result's samples at a given time.
 *
 * @param time - the time in seconds to get the volumes at
 * @returns an array containing the volume of each channel at the given time
 */
export function EvaluateVolumesAtTimeAsync(page: Page, seconds: number): Promise<number[]> {
    return page.evaluate(async (time: number) => {
        return await AudioV2Test.GetVolumesAtTimeAsync(time);
    }, seconds);
}

/**
 * Creates WAVE file data from the given samples.
 */
class WaveFileData {
    private _data: DataView;
    private _dataLength: number = 0;
    private _pos: number = 0;

    public readonly data: ArrayBuffer;

    public constructor(samples: Float32Array[], length: number, numberOfChannels: number, sampleRate: number) {
        const BytesPerSample = 2;
        const WavHeaderSize = 44;

        this._dataLength = WavHeaderSize + length * numberOfChannels * BytesPerSample;
        this.data = new ArrayBuffer(this._dataLength);
        this._data = new DataView(this.data);

        // Write WAVE header.
        this._setUint32(0x46464952); // "RIFF"
        this._setUint32(this._dataLength - 8); // Data length - 8 bytes for "RIFF" and "WAVE"
        this._setUint32(0x45564157); // "WAVE"

        // Write "fmt " chunk.
        this._setUint32(0x20746d66); // "fmt "
        this._setUint32(16); // Length = 16
        this._setUint16(1); // PCM (uncompressed)
        this._setUint16(numberOfChannels);
        this._setUint32(sampleRate);
        this._setUint32(sampleRate * numberOfChannels * BytesPerSample); // Average bytes per second
        this._setUint16(numberOfChannels * BytesPerSample); // Block-align
        this._setUint16(8 * BytesPerSample); // Bit-depth

        // Write "data" chunk.
        this._setUint32(0x61746164); // "data"
        this._setUint32(this._dataLength - this._pos - 4); // Chunk length

        // Write interleaved data.
        const interleavedSamples = new Float32Array(length * numberOfChannels);
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                interleavedSamples[i * numberOfChannels + channel] = samples[channel][i];
            }
        }
        for (let i = 0; i < interleavedSamples.length; i++) {
            const sample = Math.max(-1, Math.min(1, interleavedSamples[i])); // Clamp
            const intSample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // Scale to 16-bit signed int
            this._setInt16(intSample); // Write 16-bit sample
        }
    }

    private _setInt16(value: number): void {
        this._data.setInt16(this._pos, value, true);
        this._pos += 2;
    }

    private _setUint16(value: number): void {
        this._data.setUint16(this._pos, value, true);
        this._pos += 2;
    }

    private _setUint32(value: number): void {
        this._data.setUint32(this._pos, value, true);
        this._pos += 4;
    }
}

/**
 * Saves the audio test result as .wav files and attaches them to the given test info so they are added to the report.
 *
 * @param testInfo - the test info to attach the files to
 * @param result - the audio test result to save
 */
export function SaveAudioTestResult(testInfo: TestInfo, result: AudioTestResult): void {
    if (result.length > 0 && result.numberOfChannels > 0) {
        if (result.samples) {
            const waveFileData = new WaveFileData(result.samples, result.length, result.numberOfChannels, result.sampleRate);
            testInfo.attach("audio-samples.wav", {
                body: Buffer.from(waveFileData.data),
                contentType: "audio/wav",
            });
        }

        if (result.volumeCurves) {
            const waveFileData = new WaveFileData(result.volumeCurves, result.length, result.numberOfChannels, result.sampleRate);
            testInfo.attach("audio-volume-curves.wav", {
                body: Buffer.from(waveFileData.data),
                contentType: "audio/wav",
            });
        }
    }
}

export async function EvaluateAudioContextType(page: Page): Promise<AudioContextType> {
    return (await page.evaluate(() => {
        if (audioContext instanceof OfflineAudioContext) {
            return "Offline";
        } else if (audioContext instanceof AudioContext) {
            return "Realtime";
        } else {
            throw new Error("Unknown audio context type");
        }
    })) as AudioContextType;
}

export async function ExpectValueToBeCloseTo(page: Page, actual: number, expected: number, precision = VolumePrecision, realtimeRange = RealtimeVolumeRange): Promise<void> {
    if ((await EvaluateAudioContextType(page)) === "Offline") {
        expect(actual).toBeCloseTo(expected, precision);
    } else {
        // For "Realtime" contexts, expect larger range due to timing variations.
        const halfRange = realtimeRange / 2;
        expect(actual).toBeGreaterThanOrEqual(expected - halfRange);
        expect(actual).toBeLessThanOrEqual(expected + halfRange);
    }
}
