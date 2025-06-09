import { Channel, EvaluatePulseCountsAsync, InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();

test.describe("StaticSound clone", () => {
    test("Clone should share buffer with source by default", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            const clone = await sound.cloneAsync();

            return sound.buffer === clone.buffer;
        });

        expect(result).toBe(true);
    });

    test("Clone should share buffer with source when `cloneBuffer` option is set to `false`", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            const clone = await sound.cloneAsync({ cloneBuffer: false });

            return sound.buffer === clone.buffer;
        });

        expect(result).toBe(true);
    });

    test("Clone should not share buffer with source when `cloneBuffer` option is set to `true`", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            const clone = await sound.cloneAsync({ cloneBuffer: true });

            return sound.buffer === clone.buffer;
        });

        expect(result).toBe(false);
    });

    test("Clone should use same output bus as source by default", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const bus = await AudioV2Test.CreateBusAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { outBus: bus });

            const clone = await sound.cloneAsync();

            return sound.outBus === clone.outBus;
        });

        expect(result).toBe(true);
    });

    test("Clone should use output bus set with `outBus` option", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            const bus = await AudioV2Test.CreateBusAsync();
            const clone = await sound.cloneAsync({ outBus: bus });

            return sound.outBus === clone.outBus;
        });

        expect(result).toBe(false);
    });

    test("Clone sound with `autoplay` option set `true`", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { autoplay: true });
            sound.stop();

            const clone = await sound.cloneAsync();
            clone.stop({ waitTime: 1.8 });
        });

        expect(pulses[Channel.L]).toEqual([1, 2]);
    });
});
