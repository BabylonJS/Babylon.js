import { AddSharedAbstractSoundPlaybackTests } from "./shared/abstractSound.playback";
import { Channel, EvaluatePulseCountsAsync, InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();
AddSharedAbstractSoundPlaybackTests("StaticSound");

test.describe("StaticSound playback", () => {
    test("Play sound and call `stop` with `waitTime` parameter set to 1.8", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            sound.play();
            sound.stop({ waitTime: 1.8 });
        });

        expect(pulses[Channel.L]).toEqual([1, 2]);
    });

    test("Play two sounds, with the second sound's `waitTime` parameter set to 3", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);

            sound.play();
            sound.play({ waitTime: 3 });
        });

        expect(pulses[Channel.L]).toEqual([1, 2, 3, 1, 2, 3]);
    });

    test("Create sound with `autoplay` and `duration` options set", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { autoplay: true, duration: 1.9 });
        });

        expect(pulses[Channel.L]).toEqual([1, 2]);
    });

    test("Create sound with `loopStart` and `loopEnd` options set", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { loop: true, loopStart: 1, loopEnd: 2 });

            sound.play();
            await AudioV2Test.WaitAsync(2.8, () => {
                sound.stop();
            });
        });

        expect(pulses[Channel.L]).toEqual([1, 2, 2]);
    });

    test("Play looping sound with `loopStart` and `loopEnd` options set, pause it, and resume it", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { loop: true, loopStart: 0, loopEnd: 2 });

            sound.play();
            await AudioV2Test.WaitAsync(2.5, () => {
                sound.pause();
            });
            await AudioV2Test.WaitAsync(0.5, () => {
                sound.resume();
            });
            await AudioV2Test.WaitAsync(2, () => {
                sound.stop();
            });
        });

        // The loop region [0, 2) alternates pulse group 1 (at 0s) and group 2 (at 1s). Pausing at a playback position of
        // 0.5s and resuming must continue from that position, so group 2 plays next. Before the fix, resuming restarted
        // the loop at `loopStart`, which would have produced `[1, 2, 1, 1, 2]` instead.
        expect(pulses[Channel.L]).toEqual([1, 2, 1, 2, 1]);
    });

    test("Create sound with `pitch` option set to 1200", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountHalfSpeedSoundFile, { pitch: 1200 });

            sound.play();
        });

        expect(pulses[Channel.L]).toEqual([1, 2, 3]);
    });

    test("Create sound with `playbackRate` option set to 2", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountHalfSpeedSoundFile, { playbackRate: 2 });

            sound.play();
        });

        expect(pulses[Channel.L]).toEqual([1, 2, 3]);
    });

    test("Create sound with `playbackRate` option set to 1.5 and `pitch` option set to 500", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountHalfSpeedSoundFile, { playbackRate: 1.5, pitch: 500 });

            sound.play();
        });

        expect(pulses[Channel.L]).toEqual([1, 2, 3]);
    });

    test("Play sound with `duration` option set to 1.9", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile, { duration: 1.9 });

            sound.play();
        });

        expect(pulses[Channel.L]).toEqual([1, 2]);
    });

    test("Create 2 sounds using same buffer and play them 500 ms apart", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound1 = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulsed3CountSoundFile);
            const sound2 = await AudioV2Test.CreateSoundAsync(sound1.buffer);

            sound1.play();
            await AudioV2Test.WaitAsync(0.5, () => {
                sound2.play();
            });
        });

        expect(pulses[Channel.L]).toEqual([1, 1, 2, 2, 3, 3]);
    });

    test("Create sound with `source` parameter set to a buffer", async ({ page }) => {
        const pulses = await EvaluatePulseCountsAsync(page, async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const buffer = await BABYLON.CreateSoundBufferAsync(audioTestConfig.soundsUrl + audioTestConfig.pulsed3CountSoundFile);
            const sound = await AudioV2Test.CreateSoundAsync(buffer);

            sound.play();
        });

        expect(pulses[Channel.L]).toEqual([1, 2, 3]);
    });
});
