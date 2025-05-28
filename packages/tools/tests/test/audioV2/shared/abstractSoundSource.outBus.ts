import { EvaluateAbstractAudioNodeTestAsync } from "../utils/abstractAudioNode.utils";
import type { AudioNodeType } from "../utils/audioV2.utils";
import { Channel, EvaluateVolumesAtTimeAsync, VolumePrecision } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractSoundSourceOutBusTests = (audioNodeType: AudioNodeType) => {
    test.describe(`${audioNodeType} outBus`, () => {
        test("Setting `outBusAutoDefault` to false should play sound at 0 volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { outBusAutoDefault: false });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, 0);
            expect(volumes[Channel.R]).toBeCloseTo(0, 0);
        });

        test("Setting `outBusAutoDefault` to true should play sound at 1x volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { outBusAutoDefault: true });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });
    });
};
