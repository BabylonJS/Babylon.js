import { AudioEngine, Sound } from "core/Audio";
import { Engine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { TestDeviceInputSystem } from "../DeviceInput/testDeviceInputSystem";

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
        decodeAudioData: jest.fn().mockName("decodeAudioData").mockImplementation((data: ArrayBuffer, success: (buffer: AudioBuffer) => void, error: (error: any) => void) => {
            // Call the success callback with a mock AudioBuffer filled with 1 second of silence.
            success({
                getChannelData: jest.fn().mockName("getChannelData").mockImplementation(() => {
                    return new Float32Array(48000);
                }),
                channels: 1,
                duration: 1,
                length: 48000,
                sampleRate: 48000,
            });
        }),
        state: "running",
    };
});

// Mock document.createElement so the AudioEngine sets itself up correctly.
const Document = jest.fn().mockName("Document").mockImplementation(() => {
    return {
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
    };
});

// Mock window.AudioContext so the AudioEngine sets itself up correctly.
const Window = jest.fn().mockName("Window").mockImplementation(() => {
    return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AudioContext: AudioContext
    };
});

// Required for timers (eg. setTimeout) to work
jest.useFakeTimers();

// Mock the WebDeviceInputSystem class since it relies on parts of the window object we're not mocking, like `navigator.platform`.
jest.mock("core/DeviceInput/webDeviceInputSystem", () => {
    return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        WebDeviceInputSystem: jest
            .fn()
            .mockImplementation(
                (
                    engine: Engine,
                    onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
                    onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
                    onInputChanged: (deviceType: DeviceType, deviceSlot: number, eventData: IUIEvent) => void
                ) => {
                    return new TestDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
                }
            ),
    };
});

describe("Sound", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;

    beforeEach(() => {
        global.document = new Document;
        global.window = new Window;
        engine = new NullEngine;
        scene = new Scene(engine);
        Engine.audioEngine = new AudioEngine(null, new AudioContext, null);
    });

    afterEach(() => {
        global.document = undefined;
        global.window = undefined;
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
