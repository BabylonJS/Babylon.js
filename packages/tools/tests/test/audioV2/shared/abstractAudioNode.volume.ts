import { EvaluateAbstractAudioNodeTestAsync } from "../utils/abstractAudioNode.utils";
import type { AudioNodeType } from "../utils/audioV2.utils";
import { Channel, EvaluateErrorMessageAsync, EvaluateVolumesAtTimeAsync, ExpectValueToBeCloseTo } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractAudioNodeVolumeTests = (audioNodeType: AudioNodeType) => {
    test.describe(`${audioNodeType} volume`, () => {
        test("Volume should default to 1 and play sound at 1x volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            await ExpectValueToBeCloseTo(page, volumes[Channel.L], 1);
        });

        test("Setting `volume` to 0.5 should play sound at 0.5x volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.volume = 0.5;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
        });

        test("Setting `volume` to 2 should play sound at 2x volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.volume = 2;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            await ExpectValueToBeCloseTo(page, volumes[Channel.L], 2);
        });

        test("Calling `setVolume` with value 0.5 should play sound at 0.5x volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.setVolume(0.5);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
        });

        test("Calling `setVolume` with value 2 should play sound at 2x volume", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.setVolume(2);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            await ExpectValueToBeCloseTo(page, volumes[Channel.L], 2);
        });

        test.describe("Default ramp", () => {
            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.1x volume at 0.1 seconds with default linear shape", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1 });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.1);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.5x volume at 0.5 seconds with default linear shape", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1 });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.9x volume at 0.9 seconds with default linear shape", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1 });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.9);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.9x volume at 0.1 seconds with default linear shape", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1 });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.9);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.5x volume at 0.5 seconds with default linear shape", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1 });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.1x volume at 0.9 seconds with default linear shape", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1 });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.1);
            });
        });

        test.describe("Linear ramp", () => {
            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.1x volume at 0.1 seconds shape set to linear", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Linear });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.1);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.5x volume at 0.5 seconds with shape set to linear", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Linear });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.9x volume at 0.9 seconds with shape set to linear", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Linear });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.9);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.9x volume at 0.1 seconds with shape set to linear", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Linear });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.9);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.5x volume at 0.5 seconds with shape set to linear", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Linear });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.1x volume at 0.9 seconds with shape set to linear", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Linear });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.1);
            });
        });

        test.describe("Exponential ramp", () => {
            test("Ramping volume from 0 to 1 over 1 second should play sound at 0 volume at 0.1 seconds shape set to exponential", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Exponential });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0 volume at 0.5 seconds with shape set to exponential", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Exponential });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.3x volume at 0.9 seconds with shape set to exponential", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Exponential });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.3);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.3x volume at 0.1 seconds with shape set to exponential", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Exponential });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.3);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at close to 0 volume at 0.5 seconds with shape set to exponential", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Exponential });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at close to 0 volume at 0.9 seconds with shape set to exponential", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Exponential });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0);
            });
        });

        test.describe("Logarithmic ramp", () => {
            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.5x volume at 0.1 seconds shape set to logarithmic", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 0.85x volume at 0.5 seconds with shape set to logarithmic", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.85);
            });

            test("Ramping volume from 0 to 1 over 1 second should play sound at 1x volume at 0.9 seconds with shape set to logarithmic", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: audioNodeType === "AudioEngineV2" ? 0 : 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: audioNodeType !== "AudioEngineV2" ? 0 : 1,
                    });

                    await AudioV2Test.WaitForParameterRampDurationAsync(async () => {
                        outputNode.setVolume(1, { duration: 1, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 1);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 1x volume at 0.1 seconds with shape set to logarithmic", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    const audioEngine = await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    await AudioV2Test.WaitAsync(audioEngine.parameterRampDuration, async () => {
                        outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                        sound.play();
                        await AudioV2Test.WaitAsync(1, () => {
                            sound.stop();
                        });
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.1);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 1);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.85x volume at 0.5 seconds with shape set to logarithmic", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.85);
            });

            test("Ramping volume from 1 to 0 over 1 second should play sound at 0.5x volume at 0.9 seconds with shape set to logarithmic", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                    sound.play();
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                });

                const volumes = await EvaluateVolumesAtTimeAsync(page, 0.9);

                await ExpectValueToBeCloseTo(page, volumes[Channel.L], 0.5);
            });
        });

        test.describe("Overlapping ramps", () => {
            test('Overlapping ramps should throw error "Audio parameter not set. Wait for current ramp to finish."', async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1 });
                    sound.play();

                    await AudioV2Test.WaitAsync(0.5, () => {
                        try {
                            outputNode.setVolume(1, { duration: 1 });
                        } catch (e) {
                            errorMessage = e.message;
                        }
                        sound.stop();
                    });
                });

                const message = await EvaluateErrorMessageAsync(page);

                expect(message).toBe("Audio parameter not set. Wait for current ramp to finish.");
            });

            test("Non-overlapping ramps should not throw an error", async ({ page }) => {
                await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { volume: 1 });
                    const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                        volume: 1,
                    });

                    outputNode.setVolume(0, { duration: 1 });
                    sound.play();

                    await AudioV2Test.WaitAsync(1.5, () => {
                        try {
                            outputNode.setVolume(1, { duration: 1 });
                        } catch (e) {
                            errorMessage = e.message;
                        }
                        sound.stop();
                    });
                });

                const message = await EvaluateErrorMessageAsync(page);

                expect(message).toBe("No error");
            });
        });
    });
};
