import { AddAbstractSoundTests } from "./common/abstractSound.common";

AddAbstractSoundTests("static");

/*
        test("Play sound and call `stop` with `waitTime` parameter set to 1.8", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                    await AudioV2Test.CreateAudioEngineAsync();
                    const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                    sound.play();
                    sound.stop({ waitTime: 1.8 });

                    return await AudioV2Test.GetResultAsync();
                })
            );

            expect(result.text).toEqual(["01"]);
        });

        test("Play two sounds, with the second sound's `waitTime` parameter set to 3", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound1 = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);

                sound1.play();
                sound1.play({ waitTime: 3 });

                return await Test.Result(sound1);
            });

            // expect(result.text).toEqual(["012012"]);
        });

        test("Create 2 sounds using same buffer and play them 1000 ms apart", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound1 = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile);
                const sound2 = await Test.CreateSound(sound1.buffer);

                sound1.play();
                await AudioV2Test.WaitAsync(0.5);
                sound2.play();

                return await Test.Result(sound1);
            });

            // expect(result.text).toEqual(["001122"]);
        });

        test("Create sound with source array set to ogg/ac3 and mp3 files, with skipCodecCheck set to true", async ({ browserName, page }) => {
            const result = await page.evaluate(
                async ({ browserName }) => {
                    await AudioV2Test.CreateAudioEngineAsync();

                    try {
                        await AudioV2Test.CreateAbstractSoundAsync(soundType, [browserName === "webkit" ? Test.OggUrl : Test.Ac3Url, Test.Mp3Url], { skipCodecCheck: true });
                    } catch (e) {
                        return true;
                    }

                    return false;
                },
                { browserName }
            );
            expect(result).toEqual(true);
        });

        test("Create sound with sourceBuffer set", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const buffer = await BABYLON.CreateSoundBufferAsync(audioTestConfig.soundsUrl + audioTestConfig.pulsed3CountSoundFile);
                const sound = await AudioV2Test.CreateSoundAsync(buffer);

                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2, 3]);
        });
*/
