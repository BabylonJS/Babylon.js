import { Engine } from "core/Engines";

import { AudioBuffer, AudioTestSamples } from "./audioTestSamples";

const realSetTimeout = jest.requireActual("timers").setTimeout;

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
    private readonly _connections = new Array<any>();

    public connect(destination: any) {
        this._connections.push(destination);
    }

    public disconnect() {
        this._connections.length = 0;
    }

    public get connections() {
        return this._connections;
    }
}

class AnalyserNodeMock extends AudioNodeMock {
    fftSize = 2048;
    frequencyBinCount = this.fftSize / 2;
    minDecibels = -100;
    maxDecibels = -30;
    smoothingTimeConstant = 0.8;

    getFloatFrequencyData = jest.fn().mockName("getFloatFrequencyData");
    getByteFrequencyData = jest.fn().mockName("getByteFrequencyData");
    getFloatTimeDomainData = jest.fn().mockName("getFloatTimeDomainData");
    getByteTimeDomainData = jest.fn().mockName("getByteTimeDomainData");
}

class AudioBufferSourceNodeMock extends AudioNodeMock {
    private readonly _onEndedListeners = new Array<() => void>();

    buffer = {
        duration: 0,
    };
    detune = new AudioParamMock();
    loop = false;
    loopEnd = 0;
    loopStart = 0;
    playbackRate = new AudioParamMock();
    startTime = 0;

    onended = () => void 0;

    constructor(audioContext: AudioContextMock, options?: any) {
        super();

        audioContext.addAudioBufferSource(this);

        if (options && options.buffer) {
            this.buffer = options.buffer;
        }
    }

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

            for (const listener of this._onEndedListeners) {
                listener();
            }
        });

    addEventListener = jest
        .fn()
        .mockName("addEventListener")
        .mockImplementation((type: string, listener: () => void) => {
            if (type === "ended") {
                this._onEndedListeners.push(listener);
            }
        });

    removeEventListener = jest
        .fn()
        .mockName("removeEventListener")
        .mockImplementation((type: string, listener: () => void) => {
            if (type === "ended") {
                const index = this._onEndedListeners.indexOf(listener);
                if (index !== -1) {
                    this._onEndedListeners.splice(index, 1);
                }
            }
        });
}

class GainNodeMock extends AudioNodeMock {
    gain = new AudioParamMock();
}

class MediaElementAudioSourceNodeMock extends AudioNodeMock {}

class PannerNodeMock extends AudioNodeMock {
    coneInnerAngle = new AudioParamMock();
    coneOuterAngle = new AudioParamMock();
    coneOuterGain = new AudioParamMock();
    orientationX = new AudioParamMock();
    orientationY = new AudioParamMock();
    orientationZ = new AudioParamMock();
    positionX = new AudioParamMock();
    positionY = new AudioParamMock();
    positionZ = new AudioParamMock();

    setOrientation = jest.fn().mockName("setOrientation");
}

class StereoPannerNodeMock extends AudioNodeMock {
    pan = new AudioParamMock();
}

export class AudioContextMock {
    private _audioBufferSources = new Array<AudioBufferSourceNodeMock>();

    currentTime = 0;
    destination = new AudioNodeMock();
    state = "running";

    requireUserInteraction = false;

    get audioBufferSource() {
        return this._audioBufferSources[this._audioBufferSources.length - 1];
    }

    get audioBufferSourceWasCreated() {
        return 0 < this._audioBufferSources.length;
    }

    addAudioBufferSource(audioBufferSource: AudioBufferSourceNodeMock) {
        this._audioBufferSources.push(audioBufferSource);
    }

    dispose() {
        this._audioBufferSources.length = 0;
    }

    incrementCurrentTime(seconds: number) {
        this.currentTime += seconds;

        for (const audioBufferSource of this._audioBufferSources) {
            const currentTime = this.currentTime;
            if (audioBufferSource.startTime + audioBufferSource.buffer.duration <= currentTime) {
                audioBufferSource.stop();
            }
        }
    }

    close = jest
        .fn()
        .mockName("close")
        .mockImplementation(() => {
            this.state = "closed";
            return Promise.resolve();
        });

    createBufferSource = jest
        .fn()
        .mockName("createBufferSource")
        .mockImplementation(() => {
            const bufferSource = new AudioBufferSourceNodeMock(this);
            this.addAudioBufferSource(bufferSource);
            return bufferSource;
        });

    createGain = jest
        .fn()
        .mockName("createGain")
        .mockImplementation(() => {
            // Note that when creating a single Sound object, createGain() is called three times:
            // 1) from AudioEngine._initializeAudioContext() to create the master gain.
            // 2) from Sound constructor.
            // 3) from main SoundTrack._initializeSoundTrackAudioGraph().
            return new GainNodeMock();
        });

    createMediaElementSource = jest
        .fn()
        .mockName("createMediaElementSource")
        .mockImplementation((mediaElement: HTMLMediaElement) => {
            // Streaming sounds need to be able to create a media element source node.
            return new MediaElementAudioSourceNodeMock();
        });

    createPanner = jest
        .fn()
        .mockName("createPanner")
        .mockImplementation(() => {
            return new PannerNodeMock();
        });

    decodeAudioData = jest
        .fn()
        .mockName("decodeAudioData")
        .mockImplementation((data: ArrayBuffer, success?: (buffer: AudioBuffer) => void) => {
            if (success) {
                success(AudioTestSamples.GetAudioBuffer(data));
            }
        });

    resume = jest
        .fn()
        .mockName("resume")
        .mockImplementation(() => {
            if (!this.requireUserInteraction) {
                this.state = "running";
            }

            return Promise.resolve();
        });

    suspend = jest
        .fn()
        .mockName("suspend")
        .mockImplementation(() => {
            this.state = "suspended";
            return Promise.resolve();
        });

    addEventListener = jest.fn().mockName("addEventListener");
    removeEventListener = jest.fn().mockName("removeEventListener");
}

class OfflineAudioContextMock {}

class AudioContext extends AudioContextMock {}
class OfflineAudioContext extends OfflineAudioContextMock {}

export class MockedAudioObjects {
    private _previousAudioContext: any;

    constructor() {
        MockedAudioObjects.Instance = this;

        document.body.appendChild = jest.fn().mockName("appendChild");
        document.body.removeChild = jest.fn().mockName("removeChild");

        global.fetch = jest
            .fn()
            .mockName("fetch")
            .mockResolvedValue({
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
            } as Response);

        global.Audio = jest
            .fn()
            .mockName("Audio")
            .mockImplementation(() => {
                let canPlayThroughListener: () => void = () => void 0;
                let endedListener: (() => void) | null = null;

                return {
                    addEventListener: jest
                        .fn()
                        .mockName("addEventListener")
                        .mockImplementation((type: string, listener: () => void) => {
                            if (type === "canplaythrough") {
                                canPlayThroughListener = listener;
                            } else if (type === "ended") {
                                endedListener = listener;
                            }
                        }),
                    removeEventListener: jest
                        .fn()
                        .mockName("removeEventListener")
                        .mockImplementation((type: string, listener: () => void) => {
                            if (type === "ended" && endedListener === listener) {
                                endedListener = null;
                            }
                        }),
                    canPlayType: jest.fn().mockName("canPlayType").mockReturnValue(""),
                    children: [],
                    controls: true,
                    crossOrigin: null,
                    currentTime: 0,
                    loop: false,
                    load: jest
                        .fn()
                        .mockName("load")
                        .mockImplementation(() => {
                            // Simulate that the audio is ready to play through after load() is called.
                            realSetTimeout(() => {
                                canPlayThroughListener();
                            }, 0);
                        }),
                    pause: jest.fn().mockName("pause"),
                    play: jest.fn().mockName("play").mockReturnValue(Promise.resolve()),
                    preload: "none",
                };
            });
        global.MediaStream = jest.fn().mockName("MediaStream");

        // AudioContext mock.
        this._previousAudioContext = window.AudioContext;
        window.AudioContext = AudioContext as any;
        window.OfflineAudioContext = OfflineAudioContext as any;

        window.AudioBuffer = AudioBuffer as any;

        window.AnalyserNode = AnalyserNodeMock as any;
        window.AudioBufferSourceNode = AudioBufferSourceNodeMock as any;
        window.GainNode = GainNodeMock as any;
        window.MediaElementAudioSourceNode = MediaElementAudioSourceNodeMock as any;
        window.PannerNode = PannerNodeMock as any;
        window.StereoPannerNode = StereoPannerNodeMock as any;
    }

    get audioBufferSource() {
        return this.audioContext.audioBufferSource;
    }

    get audioBufferSourceWasCreated() {
        return this.audioContext.audioBufferSourceWasCreated;
    }

    get audioContext() {
        const audioEngine = Engine.audioEngine;
        if (!audioEngine) {
            throw new Error("No audio engine available");
        }

        return audioEngine!.audioContext as unknown as AudioContextMock;
    }

    dispose() {
        this.audioContext.dispose();
        window.AudioContext = this._previousAudioContext;
    }

    incrementCurrentTime(seconds: number) {
        this.audioContext.incrementCurrentTime(seconds);
    }

    connectsToPannerNode(node: AudioNodeMock) {
        for (const connection of node.connections) {
            if (connection instanceof PannerNodeMock || this.connectsToPannerNode(connection)) {
                return true;
            }
        }

        return false;
    }

    static Instance: MockedAudioObjects;
}
