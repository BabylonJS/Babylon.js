import { AudioTestResult, GetPulseCounts, L, SoundType } from "../utils/audioEngineV2.utils";

import { expect, Page, test } from "@playwright/test";

const EvaluatePulseCountTestAsync = async (page: Page, soundType: SoundType, testFn: ({ soundType }: { soundType: SoundType }) => Promise<AudioTestResult>) => {
    const result = await page.evaluate(testFn, { soundType });
    return GetPulseCounts(result);
};

export const AddAbstractSoundTests = (soundType: SoundType) => {
    test("Create sound with audio engine parameter not set", async ({ page }) => {
        const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

            sound.play();

            return await AudioV2Test.GetResultAsync();
        });

        expect(pulses[L]).toEqual([1, 2, 3]);
    });
};
