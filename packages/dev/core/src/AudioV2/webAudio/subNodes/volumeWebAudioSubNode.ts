import type { Nullable } from "../../../types";
import { _VolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import { AudioParameterCurveShape } from "../../audioParameter";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode, IWebAudioSubNode } from "../webAudioNode";

/** @internal */
// eslint-disable-next-line @typescript-eslint/require-await
export async function _CreateVolumeAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_VolumeAudioSubNode> {
    return new _VolumeWebAudioSubNode(engine);
}

/** @internal */
export class _VolumeWebAudioSubNode extends _VolumeAudioSubNode implements IWebAudioSubNode {
    private _volume: number = 1;
    private _volumeRampEndTime: number = 0;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly node: GainNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new GainNode(engine._audioContext);
    }

    /** @internal */
    public get volume(): number {
        return this._volume;
    }

    /** @internal */
    public set volume(value: number) {
        this.setVolume(value);
    }

    /** @internal */
    public get _inNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get _outNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public override setVolume(value: number, duration: number = 0, curve: Nullable<AudioParameterCurveShape> = null): void {
        duration = Math.max(0, duration);

        let startTime = this.engine.currentTime;
        let startValue = 0;

        // If the duration is short, start the new ramp immediately.
        if (duration < startTime + this.engine.parameterRampDuration) {
            console.log("duration is short");
            startValue = this.node.gain.value;
            duration = this.engine.parameterRampDuration;

            if (!curve) {
                curve = AudioParameterCurveShape.Linear;
            }
        } else {
            // If the current ramp has a short amount ot time left, start the new ramp after the current one ends.
            if (this._volumeRampEndTime <= this.engine.currentTime + this.engine.parameterRampDuration) {
                console.log("current ramp has short time left");
                startValue = this._volume;
                startTime = this._volumeRampEndTime;
                duration = duration - (this.engine.currentTime - startTime);
            } else {
                console.log("starting new ramp immediately");
                console.log(`this._volumeRampEndTime: ${this._volumeRampEndTime} < ${this.engine.currentTime + this.engine.parameterRampDuration}`);
                // Otherwise, start the new ramp immediately.
                startTime = this.engine.currentTime;
                startValue = this.node.gain.value;
            }

            // Default curve to logarithmic for decreasing volume and linear for increasing volume.
            if (!curve) {
                curve = value < startValue ? AudioParameterCurveShape.Exponential : AudioParameterCurveShape.Logarithmic;
            }
        }

        this.engine._setAudioParam(this.node.gain, startValue, value, startTime, duration, curve);

        this._volume = value;
        this._volumeRampEndTime = startTime + duration;
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node._inNode) {
            this.node.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node._inNode) {
            this.node.disconnect(node._inNode);
        }

        return true;
    }

    /** @internal */
    public getClassName(): string {
        return "_VolumeWebAudioSubNode";
    }
}
