import { EvaluatePulseCountTestAsync, EvaluateTestAsync } from "../utils/abstractSound.utils";
import { L, SoundType } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractSoundCurrentTimeTests = (soundType: SoundType) => {
    test.describe(`${soundType} currentTime`, () => {
        test("The `currentTime` property should equal the current playback time while playing", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);

                return sound.currentTime;
            });

            expect(result).toBeCloseTo(1, 1);
        });

        test("The `currentTime` property should equal 0 when stopped", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.stop();

                return sound.currentTime;
            });

            expect(result).toBe(0);
        });

        test("The `currentTime` property should equal the paused time of the sound in seconds while paused", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.pause();

                return sound.currentTime;
            });

            expect(result).toBeCloseTo(1, 1);
        });

        test("The `currentTime` property should equal the current playback time when paused and played again", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.pause();
                await AudioV2Test.WaitAsync(1);
                sound.play();
                await AudioV2Test.WaitAsync(1);

                return sound.currentTime;
            });

            expect(result).toBeCloseTo(2, 1);
        });

        test("The `currentTime` property should equal the sound's `startOffset` option", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { startOffset: 1 });

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.pause();

                return sound.currentTime;
            });

            expect(result).toBeCloseTo(2, 1);
        });

        test("The `currentTime` property should equal the most recently started instance's current time", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.pause();

                return sound.currentTime;
            });

            expect(result).toBeCloseTo(1, 1);
        });

        test("Setting the `currentTime` property before playing should seek to the given time", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.currentTime = 1;
                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([2, 3]);
        });

        test("Setting the `currentTime` property while playing should seek to the given time", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(0.5);
                sound.currentTime = 1.5;

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 3]);
        });

        test("Setting the `currentTime` property while paused should seek to the given time", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(0.5);
                sound.pause();
                sound.currentTime = soundType === "Static" ? 2 : 1.5;
                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 3]);
        });

        test("Setting the `currentTime` property while stopped should seek to the given time", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(0.5);
                sound.stop();
                sound.currentTime = soundType === "Static" ? 2 : 1.5;
                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 3]);
        });
    });
};
