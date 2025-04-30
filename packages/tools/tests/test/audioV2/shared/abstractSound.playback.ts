import { EvaluatePulseCountTestAsync } from "../utils/abstractSound.utils";
import { Channel, EvaluateVolumesAtTimeAsync, SoundType, VolumePrecision } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractSoundPlaybackTests = (soundType: SoundType) => {
    test.describe(`${soundType} playback`, () => {
        test("Create sound with audio engine parameter not set", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3]);
        });

        test("Create sound with `autoplay` option set to `true`", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { autoplay: true });
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3]);
        });

        test("Create sound and call `play` on it using `await`", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3]);
        });

        test("Create sound and call `play` on it using `then`", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);

                await new Promise<void>((resolve) => {
                    AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile).then(async (sound) => {
                        sound.play();
                        resolve();
                    });
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3]);
        });

        test("Create sound and call `play` on it twice", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.play();
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 1, 2, 2, 3, 3]);
        });

        test("Create sound, call `play` on it twice, and call `stop` on it", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.play();
                });
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.stop();
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 1]);
        });

        test("Create sound with `loop` option set to true", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { loop: true });

                sound.play();
                await AudioV2Test.WaitAsync(3.9, () => {
                    sound.stop();
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3, 1]);
        });

        test("Create sound with `startOffset` option set to 1", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { startOffset: 1 });

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([2, 3]);
        });

        test("Play sound with `volume` parameter set to 0.5", async ({ page }) => {
            await page.evaluate(
                async ({ soundType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(soundType);
                    const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulseTrainSoundFile);

                    sound.play({ volume: 0.5 });
                    await AudioV2Test.WaitAsync(1, () => {
                        sound.stop();
                    });
                },
                { soundType }
            );

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.5, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.5, VolumePrecision);
        });

        test("Play sound with `startOffset` option set to 1", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { startOffset: 1 });

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([2, 3]);
        });

        test("Create sound with sources set to one mp3 file URL with no query parameters", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateSoundAsync([audioTestConfig.pulsed1CountSoundFile]);

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([1]);
        });

        test("Create sound with sources set to one mp3 file URL with query parameters", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, ["pulsed-1.mp3?param1=1&param2=2"]);

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([1]);
        });

        test("Create sound with sources set to ogg and mp3 files", async ({ browserName, page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, ["pulsed-1.ogg", "pulsed-2.mp3"]);

                sound.play();
            });

            // Webkit doesn't support .ogg files, so the .mp3 file 2nd in the list should play.
            if (browserName === "webkit") {
                expect(pulses[Channel.L]).toEqual([2]);
            } else {
                // Everything else should support .ogg files, so the .ogg file 1st in the list should play.
                expect(pulses[Channel.L]).toEqual([1]);
            }
        });

        test("Create sound with source array set to ogg/ac3 and mp3 files, with skipCodecCheck set to true", async ({ browserName, page }) => {
            const raisedException = await page.evaluate(
                async ({ browserName, soundType }) => {
                    await AudioV2Test.CreateAudioEngineAsync(soundType);

                    try {
                        await AudioV2Test.CreateAbstractSoundAsync(
                            soundType,
                            [browserName === "webkit" ? audioTestConfig.formatOggSoundFile : audioTestConfig.formatAc3SoundFile, audioTestConfig.formatMp3SoundFile],
                            { skipCodecCheck: true }
                        );
                    } catch (e) {
                        return true;
                    }

                    return false;
                },
                { browserName, soundType }
            );

            expect(raisedException).toEqual(soundType === "StaticSound" ? true : false);
        });

        test("Play sound, pause it, and resume it", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.pause();
                });
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.resume();
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3]);
        });

        test("Play sound, pause it, and resume it by calling play", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.pause();
                });
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.play();
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 2, 3]);
        });

        test("Create sound with `maxInstances` set to 1", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { maxInstances: 1 });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.play();
                });
            });

            expect(pulses[Channel.L]).toEqual([1, 1, 2, 3]);
        });

        test("Create sound with `maxInstances` set to 2", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { maxInstances: 2 });

                sound.play();
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.play();
                });
                await AudioV2Test.WaitAsync(0.5, () => {
                    sound.play();
                });
            });

            // Pulse count output for each instance:
            //            Instance 1: [1                  ]
            //            Instance 2: [   1     2     3   ]
            //            Instance 3: [      1     2     3]
            expect(pulses[Channel.L]).toEqual([1, 1, 1, 2, 2, 3, 3]);
        });

        test("Create sound with url containing a # character", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync(soundType);
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.hashedSoundFile);

                sound.play();
            });

            expect(pulses[Channel.L]).toEqual([2]);
        });
    });
};
