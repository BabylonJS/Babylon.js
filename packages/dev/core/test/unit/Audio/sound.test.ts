import { AudioEngine, Sound } from "core/Audio";
import { Engine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

class AudioSample {
    public static Add(name: string, channelCount: number, sampleRate: number, channelData: Float32Array) {
        const sample = new AudioSample(channelCount, sampleRate, channelData);
        AudioSample._Array.push(sample);
        AudioSample._Map.set(name, sample);
    }

    public static Get(name: string): AudioSample {
        return AudioSample._Map.get(name)!;
    }

    public static GetArrayBuffer(name: string): ArrayBuffer {
        return AudioSample._Map.get(name)!.arrayBuffer;
    }

    public static GetAudioBuffer(arrayBuffer: ArrayBuffer): AudioBuffer {
        const indexView = new Uint32Array(arrayBuffer);
        const index = indexView[0];
        return AudioSample._Array[index].audioBuffer;
    }

    public get arrayBuffer() {
        return this._arrayBuffer;
    }

    public get audioBuffer() {
        return this._audioBuffer;
    }

    private static _Array = new Array<AudioSample>();
    private static _Map = new Map<string, AudioSample>();
    private static _CurrentArrayBufferIndex = 0;

    private static _CreateArrayBuffer = () => {
        const arrayBuffer = new ArrayBuffer(4);
        const arrayBufferView = new Uint32Array(arrayBuffer);
        arrayBufferView[0] = AudioSample._CurrentArrayBufferIndex++;
        return arrayBuffer;
    }

    private constructor(channelCount: number, sampleRate: number, channelData: Float32Array) {
        this._arrayBuffer = AudioSample._CreateArrayBuffer();
        this._audioBuffer = {
            channels: channelCount,
            duration: (channelData.length / channelCount) / sampleRate,
            length: channelData.length / channelCount,
            sampleRate: sampleRate,
            getChannelData: () => channelData
        } as unknown as AudioBuffer;
    }

    private _arrayBuffer: ArrayBuffer;
    private _audioBuffer: AudioBuffer;
}

AudioSample.Add("silence, 1 second, 1 channel, 48000 kHz", 1, 48000, new Float32Array(48000));

let mockedAudioContext: any;

const AudioContext = jest.fn().mockName("AudioContext").mockImplementation(() => {
    mockedAudioContext = {
        currentTime: 0,
        state: "running",
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
            // When creating a single Sound object, createGain() is called three times:
            // 1) from AudioEngine._initializeAudioContext() to create the master gain.
            // 2) from Sound constructor.
            // 3) from main SoundTrack._initializeSoundTrackAudioGraph().
            return {
                connect: jest.fn().mockName("connect"),
                disconnect: jest.fn().mockName("disconnect"),
                gain: {
                    value: 1
                }
            };
        }),
        decodeAudioData: jest.fn().mockName("decodeAudioData").mockImplementation((data: ArrayBuffer, success: (buffer: AudioBuffer) => void) => {
            success(AudioSample.GetAudioBuffer(data));
        })
    };
    return mockedAudioContext;
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

    it("constructor sets state correctly when given no options", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound("test", audioSample.arrayBuffer);
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
        expect(sound.name).toBe("test");
        expect(sound.refDistance).toBe(1);
        expect(sound.rolloffFactor).toBe(1);
        expect(sound.soundTrackId).toBe(-1); // Set by main SoundTrack when added to it.
        expect(sound.spatialSound).toBe(false);
        expect(sound.useCustomAttenuation).toBe(false);

        expect(sound.getAudioBuffer()).toBe(audioSample.audioBuffer);
        expect(sound.getPlaybackRate()).toBe(1);
        expect(sound.getSoundGain()).toBe(AudioContext.mock.results[0].value.createGain.mock.results[1].value);
        expect(sound.getVolume()).toBe(1);
    });

    it("sets isPlaying to true when play() is called", () => {
        const sound = new Sound("test", AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));
        sound.play();
        expect(sound.isPlaying).toBe(true);
    });

    it("updates currentTime when play() is called and audio context time advances", () => {
        const sound = new Sound("test", AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));
        
        sound.play();
        mockedAudioContext.currentTime += 0.1;

        expect(sound.currentTime).toBe(mockedAudioContext.currentTime);
    });
});
