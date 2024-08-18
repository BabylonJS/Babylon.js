/**
 * @jest-environment jsdom
 */

import { AudioEngine, Sound } from "core/Audio";
import { AbstractEngine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";

import { AudioTestHelper } from "./helpers/audioTestHelper";
import { AudioTestSamples } from "./helpers/audioTestSamples";
import { MockedAudioObjects } from "./helpers/mockedAudioObjects";

// Required for timers (eg. setTimeout) to work.
jest.useFakeTimers();

describe("Sound with no scene", () => {
    it("constructor does not set scene if no scene is given", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer) as any;

        expect(sound._scene).toBeUndefined();
    });
});

describe("Sound", () => {
    AudioTestSamples.Initialize();

    let audioEngine: AudioEngine;
    let engine: NullEngine;
    let mock: MockedAudioObjects;
    let scene: Scene;

    beforeEach(() => {
        mock = new MockedAudioObjects;
        engine = new NullEngine;
        scene = new Scene(engine);
        audioEngine = AbstractEngine.audioEngine = new AudioEngine(null, new AudioContext, null);
    });

    afterEach(() => {
        scene.dispose();
        (scene as any) = null;

        engine.dispose();
        (engine as any) = null;
        (audioEngine as any) = null;

        mock.dispose();
        (mock as any) = null;
    });

    it("constructor initializes AudioSceneComponent", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);

        expect(scene!._getComponent("Audio")).not.toBeNull();
    });

    it("constructor sets given readyToPlayCallback", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const readyToPlayCallback = jest.fn();
        new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, scene, readyToPlayCallback);

        expect(readyToPlayCallback).toBeCalled();
    });

    it("constructor sets up a linear custom attenuation function by default", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer) as any;

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

    it("constructor sets state correctly when given no options", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer) as any;

        expect(sound.autoplay).toBe(false);
        expect(sound.currentTime).toBe(0);
        expect(sound.directionalConeInnerAngle).toBe(360);
        expect(sound.directionalConeOuterAngle).toBe(360);
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
        expect(sound.getSoundGain()).toBe(mock.audioContext.createGain.mock.results[1].value);
        expect(sound.getVolume()).toBe(1);

        expect(sound._scene).toBe(scene);
    });

    it("constructor sets boolean options correctly when given false", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, {
            autoplay: false,
            loop: false,
            spatialSound: false,
            streaming: false,
            useCustomAttenuation: false
        }) as any;

        expect(sound.autoplay).toBe(false);
        expect(sound.loop).toBe(false);
        expect(sound.spatialSound).toBe(false);
        expect(sound._streaming).toBe(false);
        expect(sound.useCustomAttenuation).toBe(false);
    });

    it("constructor sets boolean options correctly when given true", () => {
        const sound = new Sound(expect.getState().currentTestName, "https://example.com/any.mp3", null, null, {
            autoplay: true,
            loop: true,
            skipCodecCheck: true,
            spatialSound: true,
            streaming: true,
            useCustomAttenuation: true
        }) as any;

        expect(sound.autoplay).toBe(true);
        expect(sound.loop).toBe(true);
        expect(sound.spatialSound).toBe(true);
        expect(sound._streaming).toBe(true);
        expect(sound.useCustomAttenuation).toBe(true);
    });

    it("constructor sets number options correctly", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, {
            length: 1,
            maxDistance: 2,
            offset: 3,
            playbackRate: 4,
            refDistance: 5,
            rolloffFactor: 6,
            volume: 7
        }) as any;

        expect(sound._length).toBe(1);
        expect(sound.maxDistance).toBe(2);
        expect(sound._offset).toBe(3);
        expect(sound._playbackRate).toBe(4);
        expect(sound.refDistance).toBe(5);
        expect(sound.rolloffFactor).toBe(6);
        expect(sound.getVolume()).toBe(7);
    });

    it("constructor sets string options correctly", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound1 = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "linear" });
        const sound2 = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "inverse" });
        const sound3 = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "exponential" });

        expect(sound1.distanceModel).toBe("linear");
        expect(sound2.distanceModel).toBe("inverse");
        expect(sound3.distanceModel).toBe("exponential");
    });

    it("constructor does codec check when no options are given", () => {
        expect(audioEngine.isMP3supported).toBe(false);
        scene!._loadFile = jest.fn().mockName("scene._loadFile");

        new Sound(expect.getState().currentTestName, "test.mp3");

        expect(scene!._loadFile).toHaveBeenCalledTimes(0);
    });

    it("constructor does codec check when skipCodecCheck option is false", () => {
        expect(audioEngine.isMP3supported).toBe(false);
        scene!._loadFile = jest.fn().mockName("scene._loadFile");

        new Sound(expect.getState().currentTestName, "test.mp3", null, null, { skipCodecCheck: false });

        expect(scene!._loadFile).toHaveBeenCalledTimes(0);
    });

    it("constructor skips codec check when skipCodecCheck option is true", () => {
        expect(audioEngine.isMP3supported).toBe(false);
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.mp3", null, null, { skipCodecCheck: true });

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp3");
    });

    it("constructor loads given .mp3 when supported", () => {
        (AbstractEngine.audioEngine as any).isMP3supported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.mp3");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp3");
    });

    it("constructor loads given .ogg when supported", () => {
        (AbstractEngine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.ogg");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.ogg");
    });

    it("constructor loads given .wav", () => {
        (AbstractEngine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.wav");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.wav");
    });

    it("constructor loads given .m4a", () => {
        (AbstractEngine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.m4a");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.m4a");
    });

    it("constructor loads given .mp4", () => {
        (AbstractEngine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.mp4");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp4");
    });

    it("constructor loads given blob", () => {
        (AbstractEngine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "blob:test");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("blob:test");
    });

    it("constructor skips given .ogg when not supported", () => {
        (AbstractEngine.audioEngine as any).isMP3supported = true;
        (AbstractEngine.audioEngine as any).isOGGsupported = false;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.ogg", "test.mp3" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp3");
    });

    it("constructor skips given .mp3 when not supported", () => {
        (AbstractEngine.audioEngine as any).isMP3supported = false;
        (AbstractEngine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.mp3", "test.ogg" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.ogg");
    });

    it("constructor loads first supported file", () => {
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.jpg", "test.png", "test.wav" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.wav");
    });

    it("constructor loads only first supported file when given multiple supported files", () => {
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.mp4", "test.m4a" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp4");
    });

    it("sets isPlaying to true when play is called", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));

        sound.play();

        expect(sound.isPlaying).toBe(true);
    });

    it("updates currentTime when play is called and audio context time advances", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));
        mock.audioContext.currentTime = 0.1

        sound.play();
        mock.incrementCurrentTime(0.2);

        expect(sound.currentTime).toBeCloseTo(0.2);
    });

    it("starts the buffer source at the constructor's given offset when play is called", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1
        };
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);

        sound.play();

        expect(mock.audioBufferSource.start).toBeCalledWith(0, 0.1, undefined);
    });

    it("resumes the buffer source node at the time it was paused at after playing from the constructor's given offset", () => {
        const pausedAtTime = 0.2;
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1
        };
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);
        mock.audioContext.currentTime = 0.1;

        sound.play();
        mock.audioContext.currentTime += pausedAtTime;
        sound.pause();
        mock.incrementCurrentTime(0.2);
        sound.play();

        const args = mock.audioBufferSource.start.mock.calls[0];
        expect(args[1]).toBeCloseTo(options.offset + pausedAtTime);
    });

    it("restarts the buffer source at the given positive offset when play, stop, play, pause, and play are called", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
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

        expect(mock.audioBufferSource.start).toBeCalledWith(mock.audioContext.currentTime, 0.9, undefined);
    });

    it("restarts the buffer source at the given zero offset when play, stop, play, pause, and play are called", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
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

        expect(mock.audioBufferSource.start).toBeCalledWith(mock.audioContext.currentTime, 0, undefined);
    });

    it("restarts the buffer source at the given offset when play, pause, updateOptions, and play are called", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1
        };
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);
        mock.audioContext.currentTime = 0.1

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();
        sound.updateOptions({ offset: 0.4 });
        sound.play();

        expect(mock.audioBufferSource.start).toBeCalledWith(mock.audioContext.currentTime, 0.4, undefined);
    });

    it("resets current time to zero when stopped while playing", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.stop();

        expect(sound.currentTime).toBe(0);
    });

    it("resets current time to zero when stopped while paused", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();
        sound.stop();

        expect(sound.currentTime).toBe(0);
    });

    it("sets current time to time it was paused at", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();

        expect(sound.currentTime).toBeCloseTo(0.2);
    });

    it("calls onended when stopped", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.stop();

        expect(onended.mock.calls.length).toBe(1);
    });

    it("calls onended when sound buffer reaches end", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        mock.incrementCurrentTime(1);

        expect(onended.mock.calls.length).toBe(1);
    });

    it("does not call onended when paused", () => {
        const audioSample = AudioTestSamples.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mock.audioContext.currentTime = 0.1
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        mock.incrementCurrentTime(0.2);
        sound.pause();

        expect(onended.mock.calls.length).toBe(0);
    });

    // For historical reasons, a sound's `isPlaying` property is set to `true` when it is constructed with the autoplay
    // option set, even if the audio context state is suspended.
    it("sets isPlaying to true when constructed with autoplay option set while audio context is suspended", () => {
        mock.audioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        expect(sound.isPlaying).toBe(true);
    });

    it("sets isPlaying to false when stopped while audio context is suspended", () => {
        mock.audioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        sound.stop();

        expect(sound.isPlaying).toBe(false);
    });

    it("does not autoplay after 500 ms when stopped before audio context is resumed", () => {
        mock.audioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        sound.stop();
        mock.audioContext.state = "running";
        jest.advanceTimersByTime(500);

        expect(AudioTestHelper.SoundWasStarted()).toBe(false);
    });

    it("does not autoplay when stopped before audio engine is unlocked", () => {
        mock.audioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();
        sound.stop();
        AbstractEngine.audioEngine!.unlock();

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect(AudioTestHelper.SoundWasStarted()).toBe(false);
        });
    });

    it("does not autoplay when played and stopped before audio engine is unlocked", () => {
        mock.audioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();
        sound.stop();
        AbstractEngine.audioEngine!.unlock();

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect(AudioTestHelper.SoundWasStarted()).toBe(false);
        });
    });

    it("connects to gain node when not spatialized via constructor", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: false });

        sound.play();

        expect(mock.nodeIsGainNode(mock.audioBufferSource.destination)).toBe(true);
    });

    it("connects to panner node when spatialized via constructor", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });

        sound.play();

        expect(mock.nodeIsPannerNode(mock.audioBufferSource.destination)).toBe(true);
    });

    it("connects to panner node when spatialized via property", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: false });
        sound.spatialSound = true;

        sound.play();

        expect(mock.nodeIsPannerNode(mock.audioBufferSource.destination)).toBe(true);
    });

    it("connects to panner node when spatialized via updateOptions", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: false });
        sound.updateOptions({ spatialSound: true });

        sound.play();

        expect(mock.nodeIsPannerNode(mock.audioBufferSource.destination)).toBe(true);
    });

    it("connects to gain node when unspatialized via property", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });
        sound.spatialSound = false;

        sound.play();

        expect(mock.nodeIsGainNode(mock.audioBufferSource.destination)).toBe(true);
    });

    it("connects to gain node when unspatialized via updateOptions", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });
        sound.updateOptions({ spatialSound: false });

        sound.play();

        expect(mock.nodeIsGainNode(mock.audioBufferSource.destination)).toBe(true);
    });

    it("connects to panner node when playing and spatialSound property is set to false before being set to true", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });

        sound.play();
        sound.spatialSound = false;
        sound.spatialSound = true;

        expect(mock.nodeIsPannerNode(mock.audioBufferSource.destination)).toBe(true);
    });
});
