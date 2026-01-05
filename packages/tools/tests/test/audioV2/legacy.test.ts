import { InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests(true, false);

test.describe(`Legacy`, () => {
    test("Audio engine should dispose without error", async ({ page }) => {
        const error = await page.evaluate(async () => {
            const audioEngine = new BABYLON.AudioEngine();
            return await new Promise<string | null>((resolve) => {
                setTimeout(() => {
                    try {
                        audioEngine.dispose();
                        resolve(null);
                    } catch (e) {
                        console.error(e);
                        resolve(e);
                    }
                }, 1000);
            });
        });

        expect(error).toBeNull();
    });
});
