import { AddAbstractSoundTests } from "./common/abstractSound.common";
import { InitAudioEngineV2Tests } from "./utils/audioEngineV2.utils";

InitAudioEngineV2Tests();
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

        test("Create sound with `autoplay` and `duration` options set", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { autoplay: true, duration: 1.9 });

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2]);
        });

        test("Create sound with `loopStart` and `loopEnd` options set", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { loop: true, loopStart: 1, loopEnd: 2 });

                sound.play();
                await AudioV2Test.WaitAsync(2.8);
                sound.stop();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2, 2]);
        });

        test("Create sound with `pitch` option set to 1200", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountHalfSpeedSoundFile, { pitch: 1200 });

                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2, 3]);
        });

        test("Create sound with `playbackRate` option set to 2", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountHalfSpeedSoundFile, { playbackRate: 2 });

                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2, 3]);
        });

        test("Create sound with `playbackRate` option set to 1.5 and `pitch` option set to 500", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountHalfSpeedSoundFile, { playbackRate: 1.5, pitch: 500 });

                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2, 3]);
        });

        test("Play sound with `duration` option set to 1.9", async ({ page }) => {
            const pulses = await EvaluatePulseCountTestAsync(page, soundType, async ({ soundType }) => {
                await AudioV2Test.CreateAudioEngineAsync();
                const sound = await AudioV2Test.CreateAbstractSoundAsync(soundType, audioTestConfig.pulsed3CountSoundFile, { duration: 1.9 });

                sound.play();

                return await AudioV2Test.GetResultAsync();
            });

            expect(pulses[L]).toEqual([1, 2]);
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
