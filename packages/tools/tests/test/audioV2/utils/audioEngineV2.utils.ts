import type { Nullable } from "@dev/core/types";
import { test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

/**
 * The maximum pulse volume in the sound test file containing the pulse train.
 */
const MaxPulseVolume = 0.1;

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
    await page.evaluate(async () => {
        await AudioV2Test.AfterEachAsync();
    });

    await page.close();
});

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

/**
 * Gets the volumes of the given result's samples.
 *
 * The volume of each pulse is calculated by taking the absolute value of the samples and averaging them over the pulse length.
 *
 * The average volume is stored in the `volumeCurves` array for each channel, and is repeated for each sample in the pulse which
 * makes the resulting `volumeCurves` array length the same as the result's `samples` array, which makes it easier to find the
 * resulting volume at a given time.
 *
 * @param result - the test result containing the samples to calculate the volume from.
 * @returns an array containing the volume of each pulse aligned with channels and samples in the given result's samples.
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
    }

    return result.volumeCurves;
}

/**
 * Gets the volumes of the given result's samples at a given time.
 *
 * @param result - the test result containing the samples to calculate the volume from.
 * @param time - the time in seconds to get the volumes at.
 * @returns an array containing the volume of each channel at the given time.
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
