import type { Nullable } from "@dev/core/types";
import { test, TestInfo } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

/**
 * The maximum pulse volume in the sound test file containing the pulse train.
 */
const MaxPulseVolume = 0.1;

export class AudioTestConfig {
    public baseUrl = getGlobalConfig().baseUrl;
    public soundsUrl = getGlobalConfig().assetsUrl + "/sound/testing/audioV2/";

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
    let audioTestConfig: AudioTestConfig;
    let audioTestResult: AudioTestResult;

    class AudioV2Test {
        public static AfterEachAsync(): Promise<void>;
        public static BeforeEachAsync(): Promise<void>;
        public static CreateAudioEngineAsync(options?: Partial<BABYLON.IWebAudioEngineOptions>): Promise<BABYLON.AudioEngineV2>;
        public static CreateSoundAsync(source: string | string[], options?: Partial<BABYLON.IStaticSoundOptions>): Promise<any>;
        public static GetResultAsync(): Promise<AudioTestResult>;
        public static WaitAsync(seconds: number): Promise<void>;
    }
}

test.beforeEach(async ({ page }) => {
    await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
        timeout: 0,
    });

    await page.waitForFunction(() => {
        return window.BABYLON;
    });

    page.setDefaultTimeout(0);

    await page.evaluate(
        async ({ config }: { config: AudioTestConfig }) => {
            audioTestConfig = config;

            await BABYLON.Tools.LoadScriptAsync(audioTestConfig.baseUrl + "/audiov2-test.js");
            await AudioV2Test.BeforeEachAsync();
        },
        { config: new AudioTestConfig() }
    );
});

test.afterEach(async ({ page }) => {
    if (test.info().status === "failed") {
        let result: AudioTestResult = (<any>test.info()).audioTestResult;

        if (!result) {
            result = await page.evaluate(async () => {
                return await AudioV2Test.GetResultAsync();
            });
        }

        SaveAudioTestResult(test.info(), result);
    }

    await page.evaluate(async () => {
        await AudioV2Test.AfterEachAsync();
    });

    await page.close();
});

/**
 * Gets the volumes of the given result's samples.
 *
 * The volume of each pulse is calculated by taking the absolute value of the samples and averaging them over the pulse length.
 *
 * The average volume is stored in the `volumeCurves` array for each channel, and is repeated for each sample in the pulse making
 * the resulting `volumeCurves` array length the same as the result's `samples` array, which makes it easier to find the
 * resulting volume at a given time.
 *
 * @param result - the test result containing the samples to calculate the volume from
 * @returns an array containing the volume of each pulse aligned with channels and samples in the given result's samples
 */
function GetVolumeCurves(result: AudioTestResult): Float32Array[] {
    if (!result.samples?.length) {
        return [];
    }

    if (result.volumeCurves) {
        return result.volumeCurves;
    }

    result.volumeCurves = new Array<Float32Array>(result.samples.length);

    for (let channel = 0; channel < result.numberOfChannels; channel++) {
        const samples = result.samples[channel];

        let curve = new Float32Array(result.length);

        let currentPolarity = samples[0] > 0;
        let iPulseStart = 0;
        let iPulseEnd = 0;

        const updateCurve = () => {
            const pulseLength = iPulseEnd - iPulseStart;
            if (pulseLength > 0) {
                let totalVolume = 0;
                for (let j = iPulseStart; j < iPulseEnd; j++) {
                    totalVolume += Math.abs(samples[j]);
                }
                const avgVolume = totalVolume / pulseLength;

                for (let j = iPulseStart; j < iPulseEnd; j++) {
                    curve[j] = avgVolume;
                }
            }
        };

        for (let i = 0; i < result.length; i++) {
            if (currentPolarity === samples[i] > 0) {
                iPulseEnd = i;
            } else {
                updateCurve();
                iPulseStart = i;
                iPulseEnd = i;
                currentPolarity = !currentPolarity;
            }
        }
        updateCurve();

        result.volumeCurves[channel] = curve;

        // Save the audio test result to the test info so it can be retrieved in `test.afterEach` and attached to the
        // report if needed.
        (<any>test.info()).audioTestResult = result;
    }

    return result.volumeCurves;
}

/**
 * Gets the volumes of the given result's samples at a given time.
 *
 * @param result - the test result containing the samples to calculate the volume from
 * @param time - the time in seconds to get the volumes at
 * @returns an array containing the volume of each channel at the given time
 */
export function GetVolumesAtTime(result: AudioTestResult, time: number): number[] {
    const volumes = new Array<number>(result.numberOfChannels);

    const sampleIndex = Math.floor(time * result.sampleRate);
    const volumeCurves = GetVolumeCurves(result);

    for (let channel = 0; channel < result.numberOfChannels; channel++) {
        const curve = volumeCurves[channel];
        if (curve && sampleIndex < curve.length) {
            volumes[channel] = curve[sampleIndex] / MaxPulseVolume;
        } else {
            volumes[channel] = 0;
        }
    }

    return volumes;
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
