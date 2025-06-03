import type { Nullable } from "../../../types";
import { _VolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import type { IAudioParamRampOptions } from "../../audioParam";
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
        this._volume = value;
        this.engine._setAudioParam(this.node.gain, value);
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
    public override setVolume(volume: number, options?: Nullable<Partial<IAudioParamRampOptions>>): void {
        const startTime = this.engine._audioContext.currentTime + (typeof options?.startTime === "number" ? options.startTime : 0);
        const duration = typeof options?.duration === "number" ? options.duration : 1;

        if (this.node.gain.cancelAndHoldAtTime) {
            this.node.gain.cancelAndHoldAtTime(startTime);
        } else if (this.node.gain.cancelScheduledValues) {
            this.node.gain.cancelScheduledValues(startTime);
        }

        // TODO: Handle non-linear ramps.
        this.node.gain.setValueCurveAtTime([this.node.gain.value, volume], startTime, duration);
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
