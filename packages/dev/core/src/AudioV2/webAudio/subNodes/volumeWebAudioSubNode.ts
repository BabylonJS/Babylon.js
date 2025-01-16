import { _VolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode, IWebAudioSubNode } from "../webAudioNode";

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
    public get inNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get outNode(): AudioNode {
        return this.node;
    }

    protected override _connect(node: IWebAudioInNode): void {
        super._connect(node);

        if (node.inNode) {
            this.node.connect(node.inNode);
        }
    }

    protected override _disconnect(node: IWebAudioInNode): void {
        super._disconnect(node);

        if (node.inNode) {
            this.node.disconnect(node.inNode);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "VolumeWebAudioSubNode";
    }
}
