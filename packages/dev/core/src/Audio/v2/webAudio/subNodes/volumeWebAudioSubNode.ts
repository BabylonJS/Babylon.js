import type { Nullable } from "../../../../types";
import type { IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { VolumeAudioSubNode } from "../../subNodes/volumeAudioSubNode";
import type { IWebAudioNode } from "../webAudioNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";

/** @internal */
export async function _CreateVolumeAudioSubNodeAsync(parent: IWebAudioParentNode, options: Nullable<IVolumeAudioOptions> = null): Promise<_VolumeWebAudioSubNode> {
    return new _VolumeWebAudioSubNode(parent, options);
}

/** @internal */
export class _VolumeWebAudioSubNode extends VolumeAudioSubNode {
    /** @internal */
    public readonly node: GainNode;

    /** @internal */
    public constructor(parent: IWebAudioParentNode, options: Nullable<IVolumeAudioOptions> = null) {
        super(parent);

        this.node = new GainNode(parent.audioContext);

        this.volume = options?.volume ?? 1;

        parent.subGraph.addSubNode(this);
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
    public getClassName(): string {
        return "VolumeWebAudioSubNode";
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this.node;
    }

    protected override _connect(node: IWebAudioNode): void {
        this.node.connect(node.webAudioInputNode);
    }

    protected override _disconnect(node: IWebAudioNode): void {
        this.node.disconnect(node.webAudioInputNode);
    }
}
