import { AudioEngine, Sound } from "core/Audio";
import { Engine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

const AudioContext = jest.fn().mockName("AudioContext").mockImplementation(() => {
    return {
        createBufferSource: jest.fn().mockName("createBufferSource").mockImplementation(() => {
            return {
                connect: jest.fn().mockName("connect"),
                disconnect: jest.fn().mockName("disconnect"),
                onended: () => void 0,
                start: jest.fn().mockName("start"),
                stop: jest.fn().mockName("stop"),
                buffer: {},
                loop: false,
                loopEnd: 0,
                loopStart: 0,
                playbackRate: {
                    value: 1
                }
            };
        }),
        createGain: jest.fn().mockName("createGain").mockImplementation(() => {
            return {
                connect: jest.fn().mockName("connect"),
                disconnect: jest.fn().mockName("disconnect"),
                gain: {
                    value: 1
                }
            };
        }),
        decodeAudioData: jest.fn().mockName("decodeAudioData").mockImplementation((data: ArrayBuffer, success: (buffer: AudioBuffer) => void) => {
            // Call the success callback with a mock AudioBuffer filled with 1 second of silence.
            success({
                getChannelData: jest.fn().mockName("getChannelData").mockImplementation(() => {
                    return new Float32Array(48000);
                }),
                channels: 1,
                duration: 1,
                length: 48000,
                sampleRate: 48000,
            } as unknown as AudioBuffer);
        }),
        state: "running",
    };
});

const Document = jest.fn().mockName("Document").mockImplementation(() => {
    return {
        // Mock document.createElement so the AudioEngine sets itself up correctly.
        createElement: jest.fn().mockName("createElement").mockImplementation((type: string) => {
            if (type === "audio") {
                return {
                    canPlayType: jest.fn()
                        .mockName("canPlayType")
                        .mockImplementation((type: string) => {
                            if (type === 'audio/mpeg; codecs="mp3"') {
                                return "probably";
                            }
                            if (type === 'audio/ogg; codecs="vorbis"') {
                                return "probably";
                            }
                            return "";
                        }),
                    play: jest.fn().mockName("play")
                };
            }
            return {};
        }),

        // Mock window.removeEventListener so NullEngine can be disposed correctly.
        removeEventListener: jest.fn().mockName("removeEventListener")
    };
});

const Navigator = jest.fn().mockName("Navigator").mockImplementation(() => {
    return {
        // Mock navigator.platform so WebDeviceInputSystem sets itself up correctly.
        platform: ""
    }
});

const Window = jest.fn().mockName("Window").mockImplementation(() => {
    return {
        // Mock window.AudioContext so the AudioEngine sets itself up correctly.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AudioContext: AudioContext,

        // Mock window.removeEventListener so NullEngine can be disposed correctly.
        removeEventListener: jest.fn().mockName("removeEventListener")
    };
});

global.document = new Document;
global.navigator = new Navigator;
global.window = new Window;

// Required for timers (eg. setTimeout) to work
jest.useFakeTimers();

describe("Sound", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;

    beforeEach(() => {
        engine = new NullEngine;
        scene = new Scene(engine);
        Engine.audioEngine = new AudioEngine(null, new AudioContext, null);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    it("sets isPlaying to true when play() is called", () => {
        // Note that the given ArrayBuffer is decoded using our mocked AudioContext, which returns one second of
        // silence no matter what we pass in. This means the ArrayBuffer we pass in here is essentially ignored.
        // Regardless, we still need one byte in it to get past the check in the Sound constructor.
        const sound = new Sound("test", new ArrayBuffer(1));
        sound.play();
        expect(sound.isPlaying).toBe(true);
    });
});
