import { _VolumeAudioSubNode } from "../../subNodes/volumeAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInputNode, IWebAudioSubNode } from "../webAudioNode";

/** @internal */
export async function _CreateVolumeAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_VolumeAudioSubNode> {
    return new _VolumeWebAudioSubNode(engine);
}

/** @internal */
class _VolumeWebAudioSubNode extends _VolumeAudioSubNode implements IWebAudioSubNode {
    /** @internal */
    public readonly node: GainNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new GainNode(engine.audioContext);
    }

    /** @internal */
    public get volume(): number {
        return this.node.gain.value;
    }

    /** @internal */
    public set volume(value: number) {
        this.node.gain.value = value;
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this.node;
    }

    protected override _connect(node: IWebAudioInputNode): void {
        super._connect(node);

        if (node.webAudioInputNode) {
            this.node.connect(node.webAudioInputNode);
        }
    }

    protected override _disconnect(node: IWebAudioInputNode): void {
        super._disconnect(node);

        if (node.webAudioInputNode) {
            this.node.disconnect(node.webAudioInputNode);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "VolumeWebAudioSubNode";
    }
}
