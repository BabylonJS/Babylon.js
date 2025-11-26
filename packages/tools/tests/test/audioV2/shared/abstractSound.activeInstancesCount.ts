import { EvaluateTestAsync } from "../utils/abstractSound.utils";
import { SoundType } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractSoundActiveInstancesCountTests = (soundType: SoundType) => {
    test.describe(`${soundType} activeInstancesCount`, () => {
        test("The `activeInstancesCount` property should equal 1 while playing", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);

                return sound.activeInstancesCount;
            });

            expect(result).toBe(1);
        });

        test("The `activeInstancesCount` property should equal 0 when stopped", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.stop();

                return sound.activeInstancesCount;
            });

            expect(result).toBe(0);
        });

        test("The `activeInstancesCount` property should equal 2 when played twice", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                sound.play();
                await AudioV2Test.WaitAsync(1);

                return sound.activeInstancesCount;
            });

            expect(result).toBe(2);
        });

        test("The `activeInstancesCount` property should equal 0 when played twice and stopped", async ({ page }) => {
            const result = await EvaluateTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.stop();

                return sound.activeInstancesCount;
            });

            expect(result).toBe(0);
        });
    });
};
