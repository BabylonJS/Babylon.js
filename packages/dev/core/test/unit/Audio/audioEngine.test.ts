/**
 * @jest-environment jsdom
 */

import { AudioEngine } from "core/Audio";
import { AbstractEngine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Sound } from "core/Audio/sound";

import { MockedAudioObjects } from "./helpers/mockedAudioObjects";
import { AudioTestSamples } from "./helpers/audioTestSamples";
import { AudioTestHelper } from "./helpers/audioTestHelper";

// Required for timers (eg. setTimeout) to work.
jest.useFakeTimers();

describe("AudioEngine", () => {
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

    it("unlocked is initialized to false when browser requires user interaction", () => {
        mock.audioContext.state = "suspended";

        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect(audioEngine.unlocked).toBe(false);
    });

    it("unlocked is initialized to true when browser does not require user interaction", () => {
        mock.audioContext.state = "running";

        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect(audioEngine.unlocked).toBe(true);
        });
    });

    it("should not show mute button until a sound plays when browser requires user interaction", () => {
        mock.audioContext.state = "suspended";
        const arrayBuffer = AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, arrayBuffer);

        expect((audioEngine as any)._muteButton).toBe(null);

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect((audioEngine as any)._muteButton).not.toBe(null);
    });

    it("should not show mute button when sound plays and browser does not require user interaction", () => {
        mock.audioContext.state = "running";
        const arrayBuffer = AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, arrayBuffer);

        expect((audioEngine as any)._muteButton).toBe(null);

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect((audioEngine as any)._muteButton).toBe(null);
    });
});
