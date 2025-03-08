import { Logger } from "../../../Misc/logger";
import type { Nullable } from "../../../types";
import type { AudioAnalyzerFFTSizeType } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import { AbstractAudioAnalyzer } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _GetAudioAnalyzerProperty, _GetAudioAnalyzerSubNode, _SetAudioAnalyzerProperty } from "../subNodes/audioAnalyzerSubNode";
import { AudioSubNode } from "../subNodes/audioSubNode";

let _emptyByteFrequencyData: Nullable<Uint8Array> = null;
let _emptyFloatFrequencyData: Nullable<Float32Array> = null;

/** @internal */
export function _GetEmptyByteFrequencyData(): Uint8Array {
    if (!_emptyByteFrequencyData) {
        _emptyByteFrequencyData = new Uint8Array();
    }
    return _emptyByteFrequencyData;
}

/** @internal */
export function _GetEmptyFloatFrequencyData(): Float32Array {
    if (!_emptyFloatFrequencyData) {
        _emptyFloatFrequencyData = new Float32Array();
    }
    return _emptyFloatFrequencyData;
}

/** @internal */
export class _AudioAnalyzer extends AbstractAudioAnalyzer {
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();
        this._subGraph = subGraph;
    }

    /** @internal */
    public get fftSize(): AudioAnalyzerFFTSizeType {
        return _GetAudioAnalyzerProperty(this._subGraph, "fftSize");
    }

    public set fftSize(value: AudioAnalyzerFFTSizeType) {
        _SetAudioAnalyzerProperty(this._subGraph, "fftSize", value);
    }

    /** @internal */
    public get isEnabled(): boolean {
        return _GetAudioAnalyzerSubNode(this._subGraph) !== null;
    }

    /** @internal */
    public get minDecibels(): number {
        return _GetAudioAnalyzerProperty(this._subGraph, "minDecibels");
    }

    public set minDecibels(value: number) {
        _SetAudioAnalyzerProperty(this._subGraph, "minDecibels", value);
    }

    /** @internal */
    public get maxDecibels(): number {
        return _GetAudioAnalyzerProperty(this._subGraph, "maxDecibels");
    }

    public set maxDecibels(value: number) {
        _SetAudioAnalyzerProperty(this._subGraph, "maxDecibels", value);
    }

    /** @internal */
    public get smoothing(): number {
        return _GetAudioAnalyzerProperty(this._subGraph, "smoothing");
    }

    public set smoothing(value: number) {
        _SetAudioAnalyzerProperty(this._subGraph, "smoothing", value);
    }

    /** @internal */
    public dispose(): void {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (subNode) {
            this._subGraph.removeSubNode(subNode);
            subNode.dispose();
        }
    }

    /** @internal */
    public async enable(): Promise<void> {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (!subNode) {
            await this._subGraph.createAndAddSubNode(AudioSubNode.ANALYZER);
        }
        return Promise.resolve();
    }

    /** @internal */
    public getByteFrequencyData(): Uint8Array {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (!subNode) {
            Logger.Warn("AudioAnalyzer not enabled");
            this.enable();
            return _GetEmptyByteFrequencyData();
        }
        return subNode.getByteFrequencyData();
    }

    /** @internal */
    public getFloatFrequencyData(): Float32Array {
        const subNode = _GetAudioAnalyzerSubNode(this._subGraph);
        if (!subNode) {
            Logger.Warn("AudioAnalyzer not enabled");
            this.enable();
            return _GetEmptyFloatFrequencyData();
        }
        return subNode.getFloatFrequencyData();
    }
}
