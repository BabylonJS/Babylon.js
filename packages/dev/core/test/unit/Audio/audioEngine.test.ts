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

function createAudioEngine(state: string): AudioEngine {
    const audioContext = new AudioContext();
    (audioContext as any).state = state;
    return (AbstractEngine.audioEngine = new AudioEngine(null, audioContext, null));
}

describe("AudioEngine", () => {
    AudioTestSamples.Initialize();

    let engine: NullEngine;
    let mock: MockedAudioObjects;
    let scene: Scene;

    beforeEach(() => {
        mock = new MockedAudioObjects();
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        (scene as any) = null;

        engine.dispose();
        (engine as any) = null;

        mock.dispose();
        (mock as any) = null;
    });

    it("unlocked is initialized to false when browser requires user interaction", () => {
        const audioEngine = createAudioEngine("suspended");

        expect(audioEngine.unlocked).toBe(false);
    });

    it("unlocked is initialized to true when browser does not require user interaction", async () => {
        const audioEngine = createAudioEngine("running");

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error("AudioEngine unlocked event was not fired."));
            }, 1000);
            audioEngine.onAudioUnlockedObservable.addOnce(() => {
                resolve(true);
            });
        });

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect(audioEngine.unlocked).toBe(true);
        });
    });

    it("should not show mute button until a sound plays when browser requires user interaction", () => {
        jest.useFakeTimers();

        const audioEngine = createAudioEngine("suspended");

        const arrayBuffer = AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, arrayBuffer);

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("none");

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("block");
    });

    it("should not show mute button when sound plays and browser does not require user interaction", () => {
        jest.useFakeTimers();

        const audioEngine = createAudioEngine("running");

        const arrayBuffer = AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, arrayBuffer);

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("none");

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("none");
    });
});
