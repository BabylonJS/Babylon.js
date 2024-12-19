import type { Nullable } from "../../../../types";
import type { IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { VolumeAudioSubNode } from "../../subNodes/volumeAudioSubNode";
import type { IWebAudioInputNode } from "../webAudioInputNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";

/** @internal */
export async function _CreateVolumeAudioSubNodeAsync(parent: IWebAudioParentNode, options: Nullable<IVolumeAudioOptions> = null): Promise<VolumeWebAudioSubNode> {
    return new VolumeWebAudioSubNode(parent, options);
}

/** @internal */
export class VolumeWebAudioSubNode extends VolumeAudioSubNode {
    /** @internal */
    public readonly node: GainNode;

    /** @internal */
    public constructor(parent: IWebAudioParentNode, options: Nullable<IVolumeAudioOptions> = null) {
        super(parent);

        this.node = new GainNode(parent.audioContext);

        this.volume = options?.volume ?? 1;
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
