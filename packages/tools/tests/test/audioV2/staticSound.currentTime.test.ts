import { AddSharedAbstractSoundCurrentTimeTests } from "./shared/abstractSound.currentTime";
import { InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();
AddSharedAbstractSoundCurrentTimeTests("StaticSound");

test.describe("StaticSound currentTime", () => {
    test("The `currentTime` property should equal the `play` function's `waitTime` parameter", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync("Realtime");
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            sound.play({ waitTime: 1 });
            await AudioV2Test.WaitAsync(2);

            return sound.currentTime;
        });

        expect(result).toBeCloseTo(1, 1);
    });
});
