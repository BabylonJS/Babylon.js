import type { Nullable } from "core/types";
import type { IStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import { StereoAudioSubNode } from "../../subNodes/stereoAudioSubNode";
import type { IWebAudioNode } from "../webAudioNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";

/** @internal */
export async function _CreateStereoAudioSubNodeAsync(owner: IWebAudioParentNode, options: Nullable<IStereoAudioOptions> = null): Promise<_StereoWebAudioSubNode> {
    return new _StereoWebAudioSubNode(owner, options);
}

/** @internal */
export class _StereoWebAudioSubNode extends StereoAudioSubNode {
    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(owner: IWebAudioParentNode, options: Nullable<IStereoAudioOptions>) {
        super(owner);

        this.node = new StereoPannerNode(owner.audioContext);

        this.pan = options?.stereoPan ?? 0;
    }

    /** @internal */
    public get pan(): number {
        return this.node.pan.value;
    }

    /** @internal */
    public set pan(value: number) {
        this.node.pan.value = value;
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
        super._connect(node);

        if (node.webAudioInputNode) {
            this.node.connect(node.webAudioInputNode);
        }
    }

    protected override _disconnect(node: IWebAudioNode): void {
        super._disconnect(node);

        if (node.webAudioInputNode) {
            this.node.disconnect(node.webAudioInputNode);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "StereoWebAudioSubNode";
    }
}
