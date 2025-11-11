import { InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();

test.describe("AudioEngineV2 sounds", () => {
    test("Sounds count should be 1 when sound is created", async ({ page }) => {
        const soundCount = await page.evaluate(async () => {
            const audioEngine = await AudioV2Test.CreateAudioEngineAsync();
            await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, -1) });

            return audioEngine.sounds.length;
        });

        expect(soundCount).toBe(1);
    });

    test("Sounds count should be 0 when sound is disposed", async ({ page }) => {
        const soundCount = await page.evaluate(async () => {
            const audioEngine = await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, -1) });

            sound.dispose();

            return audioEngine.sounds.length;
        });

        expect(soundCount).toBe(0);
    });
});
