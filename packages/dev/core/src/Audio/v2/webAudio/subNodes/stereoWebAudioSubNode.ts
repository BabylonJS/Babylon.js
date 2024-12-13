import type { Nullable } from "core/types";
import type { IStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import { StereoAudioSubNode } from "../../subNodes/stereoAudioSubNode";
import type { IWebAudioNode } from "../webAudioNode";
import type { IWebAudioSuperNode } from "../webAudioSuperNode";

/** @internal */
export async function _CreateStereoAudioSubNodeAsync(owner: IWebAudioSuperNode, options: Nullable<IStereoAudioOptions> = null): Promise<_StereoWebAudioSubNode> {
    return new _StereoWebAudioSubNode(owner, options);
}

/** @internal */
export class _StereoWebAudioSubNode extends StereoAudioSubNode {
    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode, options: Nullable<IStereoAudioOptions>) {
        super(owner);

        this.node = new StereoPannerNode(owner.audioContext);

        this.pan = options?.stereoPan ?? 0;

        owner.addSubNode(this);
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
    public getClassName(): string {
        return "StereoWebAudioSubNode";
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
