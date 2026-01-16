import { InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();

test.describe("StaticSound stop", () => {
    test("Stop should not throw error if not playing", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const audioEngine = await AudioV2Test.CreateAudioEngineAsync("Realtime");
            await ((audioEngine as any)._audioContext as AudioContext).suspend();

            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { autoplay: true, loop: true });

            let error = null;
            try {
                sound.stop();
            } catch (e) {
                error = (e as Error).message;
            }

            return error;
        });

        expect(result).toBe(null);
    });
});
