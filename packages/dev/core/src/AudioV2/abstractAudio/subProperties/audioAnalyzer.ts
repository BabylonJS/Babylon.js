import { Logger } from "../../../Misc/logger";
import type { Nullable } from "../../../types";
import type { AudioAnalyzerFFTSizeType } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import { _AudioAnalyzerDefaults, AbstractAudioAnalyzer } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _GetAudioAnalyzerSubNode, _SetAudioAnalyzerProperty } from "../subNodes/audioAnalyzerSubNode";
import { AudioSubNode } from "../subNodes/audioSubNode";

let EmptyByteFrequencyData: Nullable<Uint8Array> = null;
let EmptyFloatFrequencyData: Nullable<Float32Array> = null;

/** @internal */
export function _GetEmptyByteFrequencyData(): Uint8Array {
    if (!EmptyByteFrequencyData) {
        EmptyByteFrequencyData = new Uint8Array();
    }
    return EmptyByteFrequencyData;
}

/** @internal */
export function _GetEmptyFloatFrequencyData(): Float32Array {
    if (!EmptyFloatFrequencyData) {
        EmptyFloatFrequencyData = new Float32Array();
    }
    return EmptyFloatFrequencyData;
}

/** @internal */
export class _AudioAnalyzer extends AbstractAudioAnalyzer {
    private _fftSize: AudioAnalyzerFFTSizeType = _AudioAnalyzerDefaults.fftSize;
    private _maxDecibels: number = _AudioAnalyzerDefaults.maxDecibels;
    private _minDecibels: number = _AudioAnalyzerDefaults.minDecibels;
    private _smoothing: number = _AudioAnalyzerDefaults.smoothing;
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();
        this._subGraph = subGraph;
    }

    /** @internal */
    public get fftSize(): AudioAnalyzerFFTSizeType {
        return this._fftSize;
    }

    public set fftSize(value: AudioAnalyzerFFTSizeType) {
        this._fftSize = value;
        _SetAudioAnalyzerProperty(this._subGraph, "fftSize", value);
    }

    /** @internal */
    public get isEnabled(): boolean {
        return _GetAudioAnalyzerSubNode(this._subGraph) !== null;
    }

    /** @internal */
    public get minDecibels(): number {
        return this._minDecibels;
    }

    public set minDecibels(value: number) {
        this._minDecibels = value;
        _SetAudioAnalyzerProperty(this._subGraph, "minDecibels", value);
    }

    /** @internal */
    public get maxDecibels(): number {
        return this._maxDecibels;
    }

    public set maxDecibels(value: number) {
        this._maxDecibels = value;
        _SetAudioAnalyzerProperty(this._subGraph, "maxDecibels", value);
    }

    /** @internal */
    public get smoothing(): number {
        return this._smoothing;
    }

    public set smoothing(value: number) {
        this._smoothing = value;
        _SetAudioAnalyzerProperty(this._subGraph, "smoothing", value);
    }

    /** @internal */
    public dispose(): void {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (subNode) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._subGraph.removeSubNodeAsync(subNode);
            subNode.dispose();
        }
    }

    /** @internal */
    public async enableAsync(): Promise<void> {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (!subNode) {
            await this._subGraph.createAndAddSubNodeAsync(AudioSubNode.ANALYZER);
        }
    }

    /** @internal */
    public getByteFrequencyData(): Uint8Array {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (!subNode) {
            Logger.Warn("AudioAnalyzer not enabled");
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.enableAsync();
            return _GetEmptyByteFrequencyData();
        }
        return subNode.getByteFrequencyData();
    }

    /** @internal */
    public getFloatFrequencyData(): Float32Array {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (!subNode) {
            Logger.Warn("AudioAnalyzer not enabled");
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.enableAsync();
            return _GetEmptyFloatFrequencyData();
        }
        return subNode.getFloatFrequencyData();
    }
}
