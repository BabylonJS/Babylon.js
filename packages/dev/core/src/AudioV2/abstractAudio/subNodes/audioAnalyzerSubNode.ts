import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../audioEngineV2";
import type { AudioAnalyzerFFTSizeType, IAudioAnalyzerOptions } from "../subProperties/abstractAudioAnalyzer";
import { _AudioAnalyzerDefaults } from "../subProperties/abstractAudioAnalyzer";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

/** @internal */
export abstract class _AudioAnalyzerSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.ANALYZER, engine);
    }

    public abstract fftSize: AudioAnalyzerFFTSizeType;
    public abstract minDecibels: number;
    public abstract maxDecibels: number;
    public abstract smoothing: number;

    public abstract getByteFrequencyData(): Uint8Array;
    public abstract getFloatFrequencyData(): Float32Array;

    /** @internal */
    public setOptions(options: Partial<IAudioAnalyzerOptions>): void {
        this.fftSize = options.analyzerFFTSize ?? _AudioAnalyzerDefaults.fftSize;
        this.minDecibels = options.analyzerMinDecibels ?? _AudioAnalyzerDefaults.minDecibels;
        this.maxDecibels = options.analyzerMaxDecibels ?? _AudioAnalyzerDefaults.maxDecibels;
        this.smoothing = options.analyzerSmoothing ?? _AudioAnalyzerDefaults.smoothing;
    }
}

/** @internal */
export function _GetAudioAnalyzerSubNode(subGraph: _AbstractAudioSubGraph): Nullable<_AudioAnalyzerSubNode> {
    return subGraph.getSubNode<_AudioAnalyzerSubNode>(AudioSubNode.ANALYZER);
}

/** @internal */
export function _SetAudioAnalyzerProperty<K extends keyof typeof _AudioAnalyzerDefaults>(subGraph: _AbstractAudioSubGraph, property: K, value: _AudioAnalyzerSubNode[K]): void {
    subGraph.callOnSubNode<_AudioAnalyzerSubNode>(AudioSubNode.ANALYZER, (node) => {
        node[property] = value;
    });
}
