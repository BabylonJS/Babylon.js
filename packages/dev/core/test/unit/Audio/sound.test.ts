/**
 * @jest-environment jsdom
 */

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

class AudioParamMock {
    public cancelScheduledValues = jest.fn().mockName("cancelScheduledValues");
    public exponentialRampToValueAtTime = jest.fn().mockName("exponentialRampToValueAtTime");
    public linearRampToValueAtTime = jest.fn().mockName("linearRampToValueAtTime");
    public setTargetAtTime = jest.fn().mockName("setTargetAtTime");
    public setValueAtTime = jest.fn().mockName("setValueAtTime");
    public setValueCurveAtTime = jest.fn().mockName("setValueCurveAtTime");
    public value = 0;
}

class AudioNodeMock {
    public connect(destination: any) {
        this._destination = destination;
    }

    public disconnect() {
        this._destination = null;
    }

    public get destination() {
        return this._destination;
    }

    private _destination: any = null;
}

class AudioBufferSourceNodeMock extends AudioNodeMock {
    onended = () => void 0;

    start = jest.fn().mockName("start").mockImplementation(() => {
        mockedBufferSource.startTime = mockedAudioContext.currentTime;
    });

    stop = jest.fn().mockName("stop").mockImplementation(() => {
        mockedBufferSource?.onended();
    });

    buffer = {};
    loop = false;
    loopEnd = 0;
    loopStart = 0;
    playbackRate = {
        value: 1
    };

    startTime = 0
}

class GainNodeMock extends AudioNodeMock {
    gain = new AudioParamMock;
}

class PannerNodeMock extends AudioNodeMock {
    positionX = new AudioParamMock;
    positionY = new AudioParamMock;
    positionZ = new AudioParamMock;
    coneInnerAngle = new AudioParamMock;
    coneOuterAngle = new AudioParamMock;
    coneOuterGain = new AudioParamMock;

    setOrientation = jest.fn().mockName("setOrientation");
}

let mockedAudioContext: any = null;
let mockedBufferSource: any = null;

const incrementCurrentTime = (seconds: number) => {
    mockedAudioContext.currentTime += seconds;
    if (mockedBufferSource.startTime + mockedBufferSource.buffer.duration <= mockedAudioContext.currentTime) {
        mockedBufferSource.stop();
    }
}

global.AudioBuffer = jest.fn().mockName("AudioBuffer");
global.MediaStream = jest.fn().mockName("MediaStream");

window.AudioContext = jest.fn().mockName("AudioContext").mockImplementation(() => {
    mockedAudioContext = {
        currentTime: 0,
        state: "running",
        createBufferSource: jest.fn().mockName("createBufferSource").mockImplementation(() => {
            mockedBufferSource = new AudioBufferSourceNodeMock;
            return mockedBufferSource;
        }),
        createGain: jest.fn().mockName("createGain").mockImplementation(() => {
            // When creating a single Sound object, createGain() is called three times:
            // 1) from AudioEngine._initializeAudioContext() to create the master gain.
            // 2) from Sound constructor.
            // 3) from main SoundTrack._initializeSoundTrackAudioGraph().
            return new GainNodeMock;
        }),
        createPanner: jest.fn().mockName("createPanner").mockImplementation(() => {
            return new PannerNodeMock;
        }),
        decodeAudioData: jest.fn().mockName("decodeAudioData").mockImplementation((data: ArrayBuffer, success: (buffer: AudioBuffer) => void) => {
            success(AudioSample.GetAudioBuffer(data));
        }),
        resume: jest.fn().mockName("resume").mockImplementation(() => {
            mockedAudioContext.state = "running";
            return Promise.resolve();
        })
    };
    return mockedAudioContext;
}) as any;

const waitForAudioContextSuspendedDoubleCheck = () => {
    jest.advanceTimersByTime(500);
};

const soundWasStarted = () => {
    return mockedBufferSource !== null;
};

const whenAudioContextResumes = (callback: () => void) => {
    return Promise.resolve().then(callback);
};

// Required for timers (eg. setTimeout) to work
jest.useFakeTimers();

describe("Sound with no scene", () => {
    it("constructor does not set scene if no scene is given", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer) as any;

        expect(sound._scene).toBeUndefined();
    });
});

describe("Sound", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;

    beforeEach(() => {
        engine = new NullEngine;
        scene = new Scene(engine);
        Engine.audioEngine = new AudioEngine(null, new AudioContext, null);
    });

    afterEach(() => {
        mockedAudioContext = null;
        mockedBufferSource = null;
        scene?.dispose();
        engine?.dispose();
    });

    it("constructor initializes AudioSceneComponent", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);

        expect(scene!._getComponent("Audio")).not.toBeNull();
    });

    it("constructor sets given readyToPlayCallback", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const readyToPlayCallback = jest.fn();
        new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, scene, readyToPlayCallback);

        expect(readyToPlayCallback).toBeCalled();
    });

    it("constructor sets up a linear custom attenuation function by default", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
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
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
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
        expect(sound.getSoundGain()).toBe(mockedAudioContext.createGain.mock.results[1].value);
        expect(sound.getVolume()).toBe(1);

        expect(sound._scene).toBe(scene);
    });

    it("constructor sets boolean options correctly when given false", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
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
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, {
            autoplay: true,
            loop: true,
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
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
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
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound1 = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "linear" });
        const sound2 = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "inverse" });
        const sound3 = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, { distanceModel: "exponential" });

        expect(sound1.distanceModel).toBe("linear");
        expect(sound2.distanceModel).toBe("inverse");
        expect(sound3.distanceModel).toBe("exponential");
    });

    it("constructor does codec check when no options are given", () => {
        expect(Engine.audioEngine?.isMP3supported).toBe(false);
        scene!._loadFile = jest.fn().mockName("scene._loadFile");

        new Sound(expect.getState().currentTestName, "test.mp3");

        expect(scene!._loadFile).toHaveBeenCalledTimes(0);
    });

    it("constructor does codec check when skipCodecCheck option is false", () => {
        expect(Engine.audioEngine?.isMP3supported).toBe(false);
        scene!._loadFile = jest.fn().mockName("scene._loadFile");

        new Sound(expect.getState().currentTestName, "test.mp3", null, null, { skipCodecCheck: false });

        expect(scene!._loadFile).toHaveBeenCalledTimes(0);
    });

    it("constructor skips codec check when skipCodecCheck option is true", () => {
        expect(Engine.audioEngine?.isMP3supported).toBe(false);
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.mp3", null, null, { skipCodecCheck: true });

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp3");
    });

    it("constructor loads given .mp3 when supported", () => {
        (Engine.audioEngine as any).isMP3supported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.mp3");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp3");
    });

    it("constructor loads given .ogg when supported", () => {
        (Engine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.ogg");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.ogg");
    });

    it("constructor loads given .wav", () => {
        (Engine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.wav");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.wav");
    });

    it("constructor loads given .m4a", () => {
        (Engine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.m4a");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.m4a");
    });

    it("constructor loads given .mp4", () => {
        (Engine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "test.mp4");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp4");
    });

    it("constructor loads given blob", () => {
        (Engine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, "blob:test");

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("blob:test");
    });

    it("constructor skips given .ogg when not supported", () => {
        (Engine.audioEngine as any).isMP3supported = true;
        (Engine.audioEngine as any).isOGGsupported = false;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.ogg", "test.mp3" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp3");
    });

    it("constructor skips given .mp3 when not supported", () => {
        (Engine.audioEngine as any).isMP3supported = false;
        (Engine.audioEngine as any).isOGGsupported = true;
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.mp3", "test.ogg" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.ogg");
    });

    it("constructor first supported file", () => {
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.jpg", "test.png", "test.wav" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.wav");
    });

    it("constructor loads only the first supported file when given multiple supported files", () => {
        const sceneLoadFileMock = jest.fn().mockName("scene._loadFile");
        scene!._loadFile = sceneLoadFileMock;

        new Sound(expect.getState().currentTestName, [ "test.mp4", "test.m4a" ]);

        expect(sceneLoadFileMock).toHaveBeenCalledTimes(1);
        expect(sceneLoadFileMock.mock.calls[0][0]).toBe("test.mp4");
    });

    it("sets isPlaying to true when play is called", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));
        
        sound.play();
        
        expect(sound.isPlaying).toBe(true);
    });

    it("updates currentTime when play is called and audio context time advances", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"));
        mockedAudioContext.currentTime = 0.1
        
        sound.play();
        incrementCurrentTime(0.2);

        expect(sound.currentTime).toBeCloseTo(0.2);
    });

    it("starts the buffer source at the constructor's given offset when play is called", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1
        };
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);
        
        sound.play();
        
        expect(mockedBufferSource.start).toBeCalledWith(0, 0.1, undefined);
    });

    it("resumes the buffer source node at the time it was paused at after playing from the constructor's given offset", () => {
        const pausedAtTime = 0.2;
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1
        };
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);
        mockedAudioContext.currentTime = 0.1;

        sound.play();
        mockedAudioContext.currentTime += pausedAtTime;
        sound.pause();
        incrementCurrentTime(0.2);
        sound.play();

        const args = mockedBufferSource.start.mock.calls[0];
        expect(args[1]).toBeCloseTo(options.offset + pausedAtTime);
    });

    it("restarts the buffer source at the given positive offset when play, stop, play, pause, and play are called", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1;

        sound.play();
        incrementCurrentTime(0.1);
        sound.stop();
        incrementCurrentTime(0.1);
        sound.play(0.9);
        incrementCurrentTime(0.1);
        sound.pause();
        incrementCurrentTime(0.1);
        sound.play(0, 0.9);

        expect(mockedBufferSource.start).toBeCalledWith(mockedAudioContext.currentTime, 0.9, undefined);
    });

    it("restarts the buffer source at the given zero offset when play, stop, play, pause, and play are called", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1;

        sound.play();
        incrementCurrentTime(0.1);
        sound.stop();
        incrementCurrentTime(0.1);
        sound.play(0.9);
        incrementCurrentTime(0.1);
        sound.pause();
        incrementCurrentTime(0.1);
        sound.play(0, 0);

        expect(mockedBufferSource.start).toBeCalledWith(mockedAudioContext.currentTime, 0, undefined);
    });

    it("restarts the buffer source at the given offset when play, pause, updateOptions, and play are called", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const options = {
            offset: 0.1
        };
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer, null, null, options);
        mockedAudioContext.currentTime = 0.1
        
        sound.play();
        incrementCurrentTime(0.2);
        sound.pause();
        sound.updateOptions({ offset: 0.4 });
        sound.play();
        
        expect(mockedBufferSource.start).toBeCalledWith(mockedAudioContext.currentTime, 0.4, undefined);
    });

    it("resets current time to zero when stopped while playing", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1

        sound.play();
        incrementCurrentTime(0.2);
        sound.stop();

        expect(sound.currentTime).toBe(0);
    });

    it("resets current time to zero when stopped while paused", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1

        sound.play();
        incrementCurrentTime(0.2);
        sound.pause();
        sound.stop();

        expect(sound.currentTime).toBe(0);
    });

    it("sets current time to time it was paused at", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1

        sound.play();
        incrementCurrentTime(0.2);
        sound.pause();

        expect(sound.currentTime).toBeCloseTo(0.2);
    });

    it("calls onended when stopped", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        incrementCurrentTime(0.2);
        sound.stop();

        expect(onended.mock.calls.length).toBe(1);
    });

    it("calls onended when sound buffer reaches end", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        incrementCurrentTime(1);

        expect(onended.mock.calls.length).toBe(1);
    });

    it("does not call onended when paused", () => {
        const audioSample = AudioSample.Get("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName, audioSample.arrayBuffer);
        mockedAudioContext.currentTime = 0.1
        const onended = jest.fn().mockName("onended");
        sound.onended = onended;

        sound.play();
        incrementCurrentTime(0.2);
        sound.pause();

        expect(onended.mock.calls.length).toBe(0);
    });

    // For historical reasons, a sound's `isPlaying` property is set to `true` when it is constructed with the autoplay
    // option set, even if the audio context state is suspended.
    it("sets isPlaying to true when constructed with autoplay option set while audio context is suspended", () => {
        mockedAudioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        expect(sound.isPlaying).toBe(true);
    });

    it("sets isPlaying to false when stopped while audio context is suspended", () => {
        mockedAudioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        sound.stop();

        expect(sound.isPlaying).toBe(false);
    });

    it("does not autoplay after 500 ms when stopped before audio context is resumed", () => {
        mockedAudioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });

        sound.stop();
        mockedAudioContext.state = "running";
        jest.advanceTimersByTime(500);

        expect(soundWasStarted()).toBe(false);
    });

    it("does not autoplay when stopped before audio engine is unlocked", () => {
        mockedAudioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });
        
        waitForAudioContextSuspendedDoubleCheck();
        sound.stop();
        Engine.audioEngine!.unlock();

        return whenAudioContextResumes(() => {
            expect(soundWasStarted()).toBe(false);
        });
    });

    it("does not autoplay when played and stopped before audio engine is unlocked", () => {
        mockedAudioContext.state = "suspended";
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { autoplay: true });
    
        sound.play();
        waitForAudioContextSuspendedDoubleCheck();
        sound.stop();
        Engine.audioEngine!.unlock();

        return whenAudioContextResumes(() => {
            expect(soundWasStarted()).toBe(false);
        });
    });

    it("connects to gain node when not spatialized via constructor", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: false });

        sound.play();

        expect(mockedBufferSource.destination).toBeInstanceOf(GainNodeMock);
    });

    it("connects to panner node when spatialized via constructor", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });

        sound.play();

        expect(mockedBufferSource.destination).toBeInstanceOf(PannerNodeMock);
    });

    it("connects to panner node when spatialized via property", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: false });
        sound.spatialSound = true;

        sound.play();

        expect(mockedBufferSource.destination).toBeInstanceOf(PannerNodeMock);
    });

    it("connects to panner node when spatialized via updateOptions", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: false });
        sound.updateOptions({ spatialSound: true });

        sound.play();

        expect(mockedBufferSource.destination).toBeInstanceOf(PannerNodeMock);
    });

    it("connects to gain node when unspatialized via property", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });
        sound.spatialSound = false;

        sound.play();

        expect(mockedBufferSource.destination).toBeInstanceOf(GainNodeMock);
    });

    it("connects to gain node when unspatialized via updateOptions", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });
        sound.updateOptions({ spatialSound: false });

        sound.play();

        expect(mockedBufferSource.destination).toBeInstanceOf(GainNodeMock);
    });

    it("connects to panner node when playing and spatialSound property is set to false before being set to true", () => {
        const sound = new Sound(expect.getState().currentTestName, AudioSample.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz"), null, null, { spatialSound: true });
        
        sound.play();
        sound.spatialSound = false;
        sound.spatialSound = true;

        expect(mockedBufferSource.destination).toBeInstanceOf(PannerNodeMock);
    });
});
