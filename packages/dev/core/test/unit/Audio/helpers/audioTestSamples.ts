
export class AudioTestSamples {
    static Initialize() {
        if (AudioTestSamples._Initialized) {
            return;
        }
        AudioTestSamples.Add("silence, 1 second, 1 channel, 48000 kHz", 1, 48000, new Float32Array(48000));
        AudioTestSamples._Initialized = true;
    }

    static Add(name: string, channelCount: number, sampleRate: number, channelData: Float32Array) {
        const sample = new AudioSample(channelCount, sampleRate, channelData);
        AudioTestSamples._Array.push(sample);
        AudioTestSamples._Map.set(name, sample);
    }

    static Get(name: string): AudioSample {
        return AudioTestSamples._Map.get(name)!;
    }

    static GetArrayBuffer(name: string): ArrayBuffer {
        return AudioTestSamples._Map.get(name)!.arrayBuffer;
    }

    static GetAudioBuffer(arrayBuffer: ArrayBuffer): AudioBuffer {
        const indexView = new Uint32Array(arrayBuffer);
        const index = indexView[0];
        return AudioTestSamples._Array[index].audioBuffer;
    }

    private static _Initialized = false;
    private static _Array = new Array<AudioSample>();
    private static _Map = new Map<string, AudioSample>();
}

class AudioSample {
    constructor(channelCount: number, sampleRate: number, channelData: Float32Array) {
        this.arrayBuffer = AudioSample._CreateArrayBuffer();
        this.audioBuffer = {
            channels: channelCount,
            duration: (channelData.length / channelCount) / sampleRate,
            length: channelData.length / channelCount,
            sampleRate: sampleRate,
            getChannelData: () => channelData
        } as unknown as AudioBuffer;
    }

    arrayBuffer: ArrayBuffer;
    audioBuffer: AudioBuffer;

    private static _CurrentArrayBufferIndex = 0;

    private static _CreateArrayBuffer = () => {
        const arrayBuffer = new ArrayBuffer(4);
        const arrayBufferView = new Uint32Array(arrayBuffer);
        arrayBufferView[0] = AudioSample._CurrentArrayBufferIndex++;
        return arrayBuffer;
    }
}
