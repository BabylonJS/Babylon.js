/**
 * @jest-environment jsdom
 */

import type { ISoundOptions } from "core/Audio";
import type { Nullable } from "core/types";

import { AudioEngine, Sound } from "core/Audio";
import { AbstractEngine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";

import { AudioTestHelper } from "./helpers/audioTestHelper";
import { AudioTestSamples } from "./helpers/audioTestSamples";
import { MockedAudioObjects } from "./helpers/mockedAudioObjects";
import { SoundState } from "../../../src/AudioV2/soundState";
import { StaticSound } from "../../../src/AudioV2/abstractAudio/staticSound";
import { StreamingSound } from "../../../src/AudioV2/abstractAudio/streamingSound";

// Required for timers (eg. setTimeout) to work.
jest.useFakeTimers();

const realSetTimeout = jest.requireActual("timers").setTimeout;
const realClearTimeout = jest.requireActual("timers").clearTimeout;

async function CreateSoundAsync(
    name: string,
    urlOrArrayBuffer: any,
    scene?: Nullable<Scene>,
    readyToPlayCallback: Nullable<() => void> = null,
    options?: ISoundOptions
): Promise<Sound> {
    const callstack = new Error().stack;

    return new Promise<Sound>((resolve, reject) => {
        const timer = realSetTimeout(() => {
            throw new Error("Sound creation timed out.\n" + callstack);
        }, 1000);

        const sound = new Sound(
            name,
            urlOrArrayBuffer,
            scene,
            () => {
                realClearTimeout(timer);
                readyToPlayCallback?.();
                resolve(sound);
            },
            options
        );
    });
}

async function ZeroTimeoutAsync(): Promise<void> {
    return new Promise<void>((resolve) => {
        realSetTimeout(() => {
            resolve();
        }, 0);
    });
}

describe("Sound with no scene", () => {
    it("constructor does not set scene if no scene is given", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);

        expect((sound as any)._scene).toBeUndefined();
    });
});

describe("Sound", () => {
    AudioTestSamples.Initialize();

    let audioEngine: AudioEngine;
    let engine: NullEngine;
    let mock: MockedAudioObjects;
    let scene: Scene;

    beforeEach(() => {
        mock = new MockedAudioObjects();
        engine = new NullEngine();
        scene = new Scene(engine);
        audioEngine = AbstractEngine.audioEngine = new AudioEngine(null, new AudioContext(), null);
    });

    afterEach(() => {
        mock.dispose();
        (mock as any) = null;

        scene.dispose();
        (scene as any) = null;

        engine.dispose();
        (engine as any) = null;
        (audioEngine as any) = null;
    });

    it("constructor initializes AudioSceneComponent", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer);

        expect(scene!._getComponent("Audio")).not.toBeNull();
    });

    it("constructor sets given readyToPlayCallback", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const readyToPlayCallback = jest.fn();
        await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer, scene, readyToPlayCallback);

        expect(readyToPlayCallback).toHaveBeenCalled();
    });

    it("constructor sets up a linear custom attenuation function by default", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = (await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer)) as any;

        expect(sound._customAttenuationFunction(1, 0, 100, 0, 0)).toBeCloseTo(1);
        expect(sound._customAttenuationFunction(1, 10, 100, 0, 0)).toBeCloseTo(0.9);
        expect(sound._customAttenuationFunction(1, 20, 100, 0, 0)).toBeCloseTo(0.8);
        expect(sound._customAttenuationFunction(1, 30, 100, 0, 0)).toBeCloseTo(0.7);
        expect(sound._customAttenuationFunction(1, 40, 100, 0, 0)).toBeCloseTo(0.6);
        expect(sound._customAttenuationFunction(1, 50, 100, 0, 0)).toBeCloseTo(0.5);
        expect(sound._customAttenuationFunction(1, 60, 100, 0, 0)).toBeCloseTo(0.4);
        expect(sound._customAttenuationFunction(1, 70, 100, 0, 0)).toBeCloseTo(0.3);
        expect(sound._customAttenuationFunction(1, 80, 100, 0, 0)).toBeCloseTo(0.2);
        expect(sound._customAttenuationFunction(1, 90, 100, 0, 0)).toBeCloseTo(0.1);
        expect(sound._customAttenuationFunction(1, 100, 100, 0, 0)).toBeCloseTo(0);
    });

    it("constructor sets state correctly when given no options", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = (await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer)) as any;

        expect(sound.autoplay).toBe(false);
        expect(sound.currentTime).toBe(0);
        expect(sound.directionalConeInnerAngle).toBeCloseTo(360);
        expect(sound.directionalConeOuterAngle).toBeCloseTo(360);
        expect(sound.distanceModel).toBe("linear");
        expect(sound.isPaused).toBe(false);
        expect(sound.isPlaying).toBe(false);
        expect(sound.loop).toBe(false);
        expect(sound.maxDistance).toBe(100);
        expect(sound.metadata).toBe(null);
        expect(sound.name).toBe(expect.getState().currentTestName);
        expect(sound.refDistance).toBe(1);
        expect(sound.rolloffFactor).toBe(1);
        expect(sound.soundTrackId).toBe(-1); // Set by main SoundTrack when added to it.
        expect(sound.spatialSound).toBe(false);
        expect(sound.useCustomAttenuation).toBe(false);
        expect(sound.getAudioBuffer()).toBe(audioSample.audioBuffer);
        expect(sound.getPlaybackRate()).toBe(1);
        expect(sound.getVolume()).toBe(1);

        expect(sound._scene).toBe(scene);
    });

    it("constructor sets boolean options correctly when given false", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = (await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer, null, null, {
            autoplay: false,
            loop: false,
            spatialSound: false,
            streaming: false,
            useCustomAttenuation: false,
        })) as any;

        expect(sound.autoplay).toBe(false);
        expect(sound.loop).toBe(false);
        expect(sound.spatialSound).toBe(false);
        expect(sound._soundV2 instanceof StaticSound).toBe(true);
        expect(sound.useCustomAttenuation).toBe(false);
    });

    it("constructor sets boolean options correctly when given true", async () => {
        const sound = (await CreateSoundAsync(expect.getState().currentTestName, "https://example.com/any.mp3", null, null, {
            autoplay: true,
            loop: true,
            skipCodecCheck: true,
            spatialSound: true,
            streaming: true,
            useCustomAttenuation: true,
        })) as any;

        expect(sound.autoplay).toBe(true);
        expect(sound.loop).toBe(true);
        expect(sound.spatialSound).toBe(true);
        expect(sound._soundV2 instanceof StreamingSound).toBe(true);
        expect(sound.useCustomAttenuation).toBe(true);
    });

    it("constructor sets number options correctly", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = (await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, {
            length: 1,
            maxDistance: 2,
            offset: 3,
            playbackRate: 4,
            refDistance: 5,
            rolloffFactor: 6,
            volume: 7,
        })) as any;

        expect(sound._soundV2.duration).toBe(1);
        expect(sound.maxDistance).toBe(2);
        expect(sound._optionsV2.startOffset).toBe(3);
        expect(sound.getPlaybackRate()).toBe(4);
        expect(sound._optionsV2.spatialMinDistance).toBe(5);
        expect(sound._optionsV2.spatialRolloffFactor).toBe(6);
        expect(sound.getVolume()).toBe(7);
    });

    it("constructor sets string options correctly", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound1 = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "linear" });
        const sound2 = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "inverse" });
        const sound3 = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "exponential" });

        expect(sound1.distanceModel).toBe("linear");
        expect(sound2.distanceModel).toBe("inverse");
        expect(sound3.distanceModel).toBe("exponential");
    });

    it("sets isPlaying to true when play is called", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));

        sound.play();

        expect(sound.isPlaying).toBe(true);
    });

    it("updates currentTime when play is called and audio context time advances", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz").audioBuffer);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.2);

        expect(sound.currentTime).toBeCloseTo(0.2);
    });

    it("starts the buffer source at the constructor's given offset when play is called", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1,
        };
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);

        sound.play();

        expect(mock.audioBufferSource.start).toHaveBeenCalledWith(0, 0.1, undefined);
    });

    it("resumes the buffer source node at the time it was paused at after playing from the constructor's given offset", async () => {
        const pausedAtTime = 0.2;
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1,
        };
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer, null, null, options);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.audioContext.currentTime += pausedAtTime;
        sound.pause();
        mock.incrementCurrentTime(0.2);
        sound.play();

        const args = mock.audioBufferSource.start.mock.calls[0];
        expect(args[1]).toBeCloseTo(options.offset + pausedAtTime);
    });

    it("restarts the buffer source at the given positive offset when play, stop, play, pause, and play are called", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.1);
        sound.stop();
        mock.incrementCurrentTime(0.1);
        sound.play(0.9);
        mock.incrementCurrentTime(0.1);
        sound.pause();
        mock.incrementCurrentTime(0.1);
        sound.play(0, 0.9);

        expect(mock.audioBufferSource.start).toHaveBeenCalledWith(mock.audioContext.currentTime, 0.9, undefined);
    });

    it("restarts the buffer source at the given zero offset when play, stop, play, pause, and play are called", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.1);
        sound.stop();
        mock.incrementCurrentTime(0.1);
        sound.play(0.9);
        mock.incrementCurrentTime(0.1);
        sound.pause();
        mock.incrementCurrentTime(0.1);
        sound.play(0, 0);

        expect(mock.audioBufferSource.start).toHaveBeenCalledWith(mock.audioContext.currentTime, 0, undefined);
    });

    it("restarts the buffer source at the given offset when play, pause, updateOptions, and play are called", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1,
        };
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer, null, null, options);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();
        sound.updateOptions({ offset: 0.4 });
        sound.play();

        expect(mock.audioBufferSource.start).toHaveBeenCalledWith(mock.audioContext.currentTime, 0.4, undefined);
    });

    it("resets current time to zero when stopped while playing", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.stop();

        expect(sound.currentTime).toBe(0);
    });

    it("resets current time to zero when stopped while paused", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();
        sound.stop();

        expect(sound.currentTime).toBe(0);
    });

    it("sets current time to time it was paused at", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();

        expect(sound.currentTime).toBeCloseTo(0.2);
    });

    it("calls onended when stopped", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1;
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.stop();

        expect(onended.mock.calls.length).toBe(1);
    });

    it("calls onended when sound buffer reaches end", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1;
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        mock.incrementCurrentTime(1);

        expect(onended.mock.calls.length).toBe(1);
    });

    it("does not call onended when paused", async () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = await CreateSoundAsync(expect.getState().currentTestName, audioSample.audioBuffer);
        mock.audioContext.currentTime = 0.1;
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();

        expect(onended.mock.calls.length).toBe(0);
    });

    // For historical reasons, a sound's `isPlaying` property is set to `true` when it is constructed with the autoplay
    // option set, even if the audio context state is suspended.
    it("sets isPlaying to true when constructed with autoplay option set while audio context is suspended", async () => {
        mock.audioContext.state = "suspended";
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            autoplay: true,
        });

        expect(sound.isPlaying).toBe(true);
    });

    it("sets isPlaying to false when stopped while audio context is suspended", async () => {
        mock.audioContext.state = "suspended";
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            autoplay: true,
        });

        sound.stop();

        expect(sound.isPlaying).toBe(false);
    });

    it("does not autoplay after 500 ms when stopped before audio context is resumed", async () => {
        mock.audioContext.state = "suspended";
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            autoplay: true,
        });

        sound.stop();
        mock.audioContext.state = "running";
        jest.advanceTimersByTime(500);

        expect((sound as any)._soundV2.state).toBe(SoundState.Stopped);
    });

    it("does not autoplay when stopped before audio engine is unlocked", async () => {
        mock.audioContext.state = "suspended";
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            autoplay: true,
        });

        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();
        sound.stop();
        AbstractEngine.audioEngine!.unlock();

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect((sound as any)._soundV2.state).toBe(SoundState.Stopped);
        });
    });

    it("does not autoplay when played and stopped before audio engine is unlocked", async () => {
        mock.audioContext.state = "suspended";
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            autoplay: true,
        });

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();
        sound.stop();
        AbstractEngine.audioEngine!.unlock();

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect((sound as any)._soundV2.state).toBe(SoundState.Stopped);
        });
    });

    it("connects to gain node when not spatialized via constructor", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: false,
        });

        sound.play();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(false);
    });

    it("connects to panner node when spatialized via constructor", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: true,
        });

        sound.play();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(true);
    });

    it("connects to panner node when spatialized via property", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: false,
        });

        sound.spatialSound = true;
        await ZeroTimeoutAsync();

        sound.play();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(true);
    });

    it("connects to panner node when spatialized via updateOptions", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: false,
        });

        sound.updateOptions({ spatialSound: true });
        await ZeroTimeoutAsync();

        sound.play();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(true);
    });

    it("connects to gain node when unspatialized via property", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: true,
        });

        sound.spatialSound = false;
        await ZeroTimeoutAsync();

        sound.play();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(false);
    });

    it("connects to gain node when unspatialized via updateOptions", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: true,
        });

        sound.updateOptions({ spatialSound: false });
        await ZeroTimeoutAsync();

        sound.play();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(false);
    });

    it("connects to panner node when playing and spatialSound property is set to false before being set to true", async () => {
        const sound = await CreateSoundAsync(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, {
            spatialSound: true,
        });

        sound.play();

        sound.spatialSound = false;
        await ZeroTimeoutAsync();

        sound.spatialSound = true;
        await ZeroTimeoutAsync();

        expect(mock.connectsToPannerNode(mock.audioBufferSource)).toBe(true);
    });

    it("calling stop() on a streaming sound instance triggers onended exactly once and does not re-enter dispose()/stop()", async () => {
        const sound = (await CreateSoundAsync(expect.getState().currentTestName, "https://example.com/any.mp3", null, null, {
            skipCodecCheck: true,
            streaming: true,
        })) as any;

        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        // Play creates the instance; wait for the async canplaythrough event to fire.
        sound.play();
        await ZeroTimeoutAsync();

        const soundV2 = sound._soundV2 as StreamingSound;
        const instance = (soundV2 as any)._getNewestInstance();
        expect(instance).not.toBeNull();

        // Spy on dispose to count calls.
        const disposeSpy = jest.spyOn(instance, "dispose");

        sound.stop();

        // onended should be triggered exactly once.
        expect(onended).toHaveBeenCalledTimes(1);

        // dispose should be called exactly once (from _onInstanceEnded), not re-entered.
        expect(disposeSpy).toHaveBeenCalledTimes(1);

        disposeSpy.mockRestore();
    });
});
