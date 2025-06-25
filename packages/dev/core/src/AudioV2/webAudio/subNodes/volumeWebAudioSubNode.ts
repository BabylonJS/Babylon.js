import type { Nullable } from "../../../types";
import { _VolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import type { IAudioParameterRampOptions } from "../../audioParameter";
import { _WebAudioParameterComponent } from "../components/webAudioParameterComponent";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode, IWebAudioSubNode } from "../webAudioNode";

/** @internal */
// eslint-disable-next-line @typescript-eslint/require-await
export async function _CreateVolumeAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_VolumeAudioSubNode> {
    return new _VolumeWebAudioSubNode(engine);
}

/** @internal */
export class _VolumeWebAudioSubNode extends _VolumeAudioSubNode implements IWebAudioSubNode {
    private _volume: _WebAudioParameterComponent;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly node: AudioNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        const gainNode = (this.node = new GainNode(engine._audioContext));
        this._volume = new _WebAudioParameterComponent(engine, gainNode.gain);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._volume.dispose();
    }

    /** @internal */
    public get volume(): number {
        return this._volume.value;
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
    public setVolume(value: number, options: Nullable<Partial<IAudioParameterRampOptions>> = null): void {
        this._volume.setTargetValue(value, options);
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
