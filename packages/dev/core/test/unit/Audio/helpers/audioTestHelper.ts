import { MockedAudioObjects } from "./mockedAudioObjects";

export class AudioTestHelper {
    static SoundWasStarted() {
        // When a Sound object actually starts playing, it creates an audio buffer source. We use this here to know
        // if a sound started playing or not.
        return MockedAudioObjects.Instance.audioBufferSourceWasCreated;
    }

    /**
     * Advance timers by 500ms to trigger the Sound class's timeout used for double-checking the audio context state.
     *
     * https://github.com/BabylonJS/Babylon.js/blob/7e6ad554/packages/dev/core/src/Audio/sound.ts#L888-L891
     */
    static WaitForAudioContextSuspendedDoubleCheck() {
        jest.advanceTimersByTime(500);
    }

    static WhenAudioContextResumes(callback: () => void) {
        return Promise.resolve().then(callback);
    }
}
