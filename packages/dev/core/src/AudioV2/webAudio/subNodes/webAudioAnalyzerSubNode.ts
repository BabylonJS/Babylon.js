import type { Nullable } from "../../../types";
import { _AudioAnalyzerSubNode } from "../../abstractAudio/subNodes/audioAnalyzerSubNode";
import type { AudioAnalyzerFFTSizeType } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import { _GetEmptyByteFrequencyData, _GetEmptyFloatFrequencyData } from "../../abstractAudio/subProperties/audioAnalyzer";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

/** @internal */
// eslint-disable-next-line @typescript-eslint/require-await
export async function _CreateAudioAnalyzerSubNodeAsync(engine: _WebAudioEngine): Promise<_AudioAnalyzerSubNode> {
    return new _WebAudioAnalyzerSubNode(engine);
}

/** @internal */
export class _WebAudioAnalyzerSubNode extends _AudioAnalyzerSubNode implements IWebAudioInNode {
    private readonly _analyzerNode: AnalyserNode;
    private _byteFrequencyData: Nullable<Uint8Array<ArrayBuffer>> = null;
    private _floatFrequencyData: Nullable<Float32Array<ArrayBuffer>> = null;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this._analyzerNode = new AnalyserNode(engine._audioContext);
    }

    /** @internal */
    public get fftSize(): AudioAnalyzerFFTSizeType {
        return this._analyzerNode.fftSize as AudioAnalyzerFFTSizeType;
    }

    public set fftSize(value: AudioAnalyzerFFTSizeType) {
        if (value === this._analyzerNode.fftSize) {
            return;
        }

        this._analyzerNode.fftSize = value;

        this._clearArrays();
    }

    /** @internal */
    public get _inNode(): AudioNode {
        return this._analyzerNode;
    }

    /** @internal */
    public get minDecibels(): number {
        return this._analyzerNode.minDecibels;
    }

    public set minDecibels(value: number) {
        this._analyzerNode.minDecibels = value;
    }

    /** @internal */
    public get maxDecibels(): number {
        return this._analyzerNode.maxDecibels;
    }

    public set maxDecibels(value: number) {
        this._analyzerNode.maxDecibels = value;
    }

    /** @internal */
    public get smoothing(): number {
        return this._analyzerNode.smoothingTimeConstant;
    }

    public set smoothing(value: number) {
        this._analyzerNode.smoothingTimeConstant = value;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._clearArrays();
        this._byteFrequencyData = null;
        this._floatFrequencyData = null;

        this._analyzerNode.disconnect();
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioAnalyzerSubNode";
    }

    /** @internal */
    public getByteFrequencyData(): Uint8Array {
        if (!this._byteFrequencyData || this._byteFrequencyData.length === 0) {
            this._byteFrequencyData = new Uint8Array(this._analyzerNode.frequencyBinCount);
        }
        this._analyzerNode.getByteFrequencyData(this._byteFrequencyData);
        return this._byteFrequencyData;
    }

    /** @internal */
    public getFloatFrequencyData(): Float32Array {
        if (!this._floatFrequencyData || this._floatFrequencyData.length === 0) {
            this._floatFrequencyData = new Float32Array(this._analyzerNode.frequencyBinCount);
        }
        this._analyzerNode.getFloatFrequencyData(this._floatFrequencyData);
        return this._floatFrequencyData;
    }

    private _clearArrays(): void {
        this._byteFrequencyData?.set(_GetEmptyByteFrequencyData());
        this._floatFrequencyData?.set(_GetEmptyFloatFrequencyData());
    }
}
