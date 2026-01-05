import { InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests(true, false);

test.describe(`AudioParam`, () => {
    test("Audio parameter should not throw error when given `NaN` value", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { autoplay: true, loop: true });

            let error = null;
            try {
                sound.volume = NaN;
            } catch (e) {
                error = (e as Error).message;
            }

            return error;
        });

        expect(result).toBe(null);
    });

    test("Audio parameter should not throw error when given `Infinity` value", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { autoplay: true, loop: true });

            let error = null;
            try {
                sound.volume = Infinity;
            } catch (e) {
                error = (e as Error).message;
            }

            return error;
        });

        expect(result).toBe(null);
    });

    test("Audio parameter should not throw error when given `-Infinity` value", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { autoplay: true, loop: true });

            let error = null;
            try {
                sound.volume = -Infinity;
            } catch (e) {
                error = (e as Error).message;
            }

            return error;
        });

        expect(result).toBe(null);
    });
});
