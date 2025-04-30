import { EvaluateAbstractAudioNodeTestAsync } from "../utils/abstractAudioNode.utils";
import type { AudioNodeType } from "../utils/audioV2.utils";
import { Channel, EvaluateVolumesAtTimeAsync, VolumePrecision } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractAudioNodeStereoTests = (audioNodeType: AudioNodeType) => {
    test.describe(`${audioNodeType} stereo`, () => {
        test("Stereo pan should default to 0 and play sound at 1x volume in both speakers", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });

        test("Setting `stereoPan` option to -1 should play sound at 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { stereoPan: -1 });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `stereoPan` option to 1 should play sound at 0 volume in left speaker and 1x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { stereoPan: 1 });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });

        test("Setting `stereoPan` option to -0.5 should play sound at 0.91x volume in left speaker and 0.38x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { stereoPan: -0.5 });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.91, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.38, VolumePrecision);
        });

        test("Setting `stereoPan` option to 0.5 should play sound at 0.38x volume in left speaker and 0.91x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { stereoPan: 0.5 });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.38, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.91, VolumePrecision);
        });

        test("Setting `stereo.pan` property to -1 should play sound at 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.stereo.pan = -1;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `stereo.pan` property to 1 should play sound at 0 volume in left speaker and 1x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.stereo.pan = 1;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });

        test("Setting `stereo.pan` property to -0.5 should play sound at 0.91x volume in left speaker and 0.38x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.stereo.pan = -0.5;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.91, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.38, VolumePrecision);
        });

        test("Setting `stereo.pan` property to 0.5 should play sound at 0.38x volume in left speaker and 0.91x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.stereo.pan = 0.5;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.38, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.91, VolumePrecision);
        });
    });
};
