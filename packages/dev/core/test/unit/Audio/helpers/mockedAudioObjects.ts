import { Engine } from "core/Engines";

import { AudioTestSamples } from "./audioTestSamples";

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

    start = jest
        .fn()
        .mockName("start")
        .mockImplementation(() => {
            this.startTime = MockedAudioObjects.Instance.audioContext.currentTime;
        });

    stop = jest
        .fn()
        .mockName("stop")
        .mockImplementation(() => {
            this.onended();
        });

    buffer = {
        duration: 0,
    };
    loop = false;
    loopEnd = 0;
    loopStart = 0;
    playbackRate = {
        value: 1,
    };

    startTime = 0;
}

class GainNodeMock extends AudioNodeMock {
    gain = new AudioParamMock();
}

class MediaElementAudioSourceNodeMock extends AudioNodeMock {}

class PannerNodeMock extends AudioNodeMock {
    positionX = new AudioParamMock();
    positionY = new AudioParamMock();
    positionZ = new AudioParamMock();
    coneInnerAngle = new AudioParamMock();
    coneOuterAngle = new AudioParamMock();
    coneOuterGain = new AudioParamMock();

    setOrientation = jest.fn().mockName("setOrientation");
}

export class MockedAudioObjects {
    static Instance: MockedAudioObjects;

    constructor() {
        MockedAudioObjects.Instance = this;

        document.body.appendChild = jest.fn().mockName("appendChild");
        document.body.removeChild = jest.fn().mockName("removeChild");

        global.Audio = jest
            .fn()
            .mockName("Audio")
            .mockImplementation(() => {
                return {
                    addEventListener: jest.fn().mockName("addEventListener"),
                    controls: true,
                    crossOrigin: null,
                    loop: false,
                    load: jest.fn().mockName("load"),
                    pause: jest.fn().mockName("pause"),
                    preload: "none",
                };
            });
        global.AudioBuffer = jest.fn().mockName("AudioBuffer");
        global.MediaStream = jest.fn().mockName("MediaStream");

        // AudioContext mock.
        this._previousAudioContext = window.AudioContext;
        window.AudioContext = jest
            .fn()
            .mockName("AudioContext")
            .mockImplementation(() => {
                return {
                    currentTime: 0,
                    state: "running",
                    close: jest
                        .fn()
                        .mockName("close")
                        .mockImplementation(() => {
                            this.audioContext.state = "closed";
                            return Promise.resolve();
                        }),
                    createBufferSource: jest
                        .fn()
                        .mockName("createBufferSource")
                        .mockImplementation(() => {
                            const bufferSource = new AudioBufferSourceNodeMock();
                            this._audioBufferSources.push(bufferSource);
                            return bufferSource;
                        }),
                    createGain: jest
                        .fn()
                        .mockName("createGain")
                        .mockImplementation(() => {
                            // Note that when creating a single Sound object, createGain() is called three times:
                            // 1) from AudioEngine._initializeAudioContext() to create the master gain.
                            // 2) from Sound constructor.
                            // 3) from main SoundTrack._initializeSoundTrackAudioGraph().
                            return new GainNodeMock();
                        }),
                    createMediaElementSource: jest
                        .fn()
                        .mockName("createMediaElementSource")
                        .mockImplementation((mediaElement: HTMLMediaElement) => {
                            // Streaming sounds need to be able to create a media element source node.
                            return new MediaElementAudioSourceNodeMock();
                        }),
                    createPanner: jest
                        .fn()
                        .mockName("createPanner")
                        .mockImplementation(() => {
                            return new PannerNodeMock();
                        }),
                    decodeAudioData: jest
                        .fn()
                        .mockName("decodeAudioData")
                        .mockImplementation((data: ArrayBuffer, success: (buffer: AudioBuffer) => void) => {
                            success(AudioTestSamples.GetAudioBuffer(data));
                        }),
                    resume: jest
                        .fn()
                        .mockName("resume")
                        .mockImplementation(() => {
                            this.audioContext.state = "running";
                            return Promise.resolve();
                        }),
                    suspend: jest
                        .fn()
                        .mockName("suspend")
                        .mockImplementation(() => {
                            this.audioContext.state = "suspended";
                            return Promise.resolve();
                        }),
                    addEventListener: jest.fn().mockName("addEventListener"),
                };
            }) as any;
    }

    get audioBufferSource() {
        return this._audioBufferSources[this._audioBufferSources.length - 1];
    }

    get audioBufferSourceWasCreated() {
        return 0 < this._audioBufferSources.length;
    }

    get audioContext() {
        // Return the audio context as `any` so its `state` property can be set.
        return Engine.audioEngine!.audioContext! as any;
    }

    dispose() {
        this._audioBufferSources.length = 0;
        window.AudioContext = this._previousAudioContext;
    }

    incrementCurrentTime(seconds: number) {
        this.audioContext.currentTime += seconds;
        this._audioBufferSources.forEach((audioBufferSource) => {
            if (audioBufferSource.startTime + audioBufferSource.buffer.duration <= this.audioContext.currentTime) {
                audioBufferSource.stop();
            }
        });
    }

    nodeIsGainNode(node: AudioNode) {
        return node instanceof GainNodeMock;
    }

    nodeIsPannerNode(node: AudioNode) {
        return node instanceof PannerNodeMock;
    }

    private _previousAudioContext: any;
    private _audioBufferSources = new Array<AudioBufferSourceNodeMock>();
}
