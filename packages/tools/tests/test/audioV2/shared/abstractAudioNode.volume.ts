import { EvaluateAbstractAudioNodeTestAsync } from "../utils/abstractAudioNode.utils";
import type { AudioNodeType } from "../utils/audioV2.utils";
import { GetVolumesAtTime, L, VolumePrecision } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractAudioNodeVolumeTests = (audioNodeType: AudioNodeType) => {
    test.describe(`${audioNodeType} volume`, () => {
        test("Volume should default to 1 and play sound at 1x volume", async ({ page }) => {
            const result = await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.stop();

                return await AudioV2Test.GetResultAsync();
            });

            const volumes = GetVolumesAtTime(result, 0.5);

            expect(volumes[L]).toBeCloseTo(1, VolumePrecision);
        });

        test("Setting `volume` to 0.5 should play sound at 0.5x volume ", async ({ page }) => {
            const result = await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.volume = 0.5;
                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.stop();

                return await AudioV2Test.GetResultAsync();
            });

            const volumes = GetVolumesAtTime(result, 0.5);

            expect(volumes[L]).toBeCloseTo(0.5, VolumePrecision);
        });

        test("Setting `volume` to 2 should play sound at 2x volume ", async ({ page }) => {
            const result = await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.volume = 2;
                sound.play();
                await AudioV2Test.WaitAsync(1);
                sound.stop();

                return await AudioV2Test.GetResultAsync();
            });

            const volumes = GetVolumesAtTime(result, 0.5);

            expect(volumes[L]).toBeCloseTo(2, 0);
        });
    });
};
