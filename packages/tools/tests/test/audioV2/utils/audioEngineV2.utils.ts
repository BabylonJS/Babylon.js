import type { Nullable } from "@dev/core/types";
import { test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

// Declarations for babylonServer/public/audiov2-test.js
declare global {
    let audioTestConfig: Nullable<AudioTestConfig>;
    let audioTestResult: Nullable<AudioTestResult>;

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

    // await page.close();
});

export class AudioTestConfig {
    public baseUrl = getGlobalConfig().baseUrl;
    public soundsUrl = getGlobalConfig().assetsUrl + "/sound/testing/audioV2/";
}

export class AudioTestResult {
    public length: number = 0;
    public numberOfChannels: number = 0;
    public sampleRate: number = 0;
    public samples: Nullable<Float32Array[]> = null;
    public volumeCurves: Nullable<Float32Array[]> = null;
}

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

export function GetVolumesAtTime(result: AudioTestResult, time: number): number[] {
    const volumes = new Array<number>(result.numberOfChannels);

    const sampleIndex = Math.floor(time * result.sampleRate);
    const volumeCurves = GetVolumeCurves(result);

    for (let channel = 0; channel < result.numberOfChannels; channel++) {
        const curve = volumeCurves[channel];
        if (curve && sampleIndex < curve.length) {
            volumes[channel] = curve[sampleIndex];
        } else {
            volumes[channel] = 0;
        }
    }

    return volumes;
}
