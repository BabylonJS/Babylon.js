import type { Nullable } from "core/types";
import type { IStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import { StereoAudio, StereoAudioSubNode } from "../../subNodes/stereoAudioSubNode";
import type { IWebAudioInputNode } from "../webAudioInputNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";

/** @internal */
export async function _CreateStereoAudioSubNodeAsync(owner: IWebAudioParentNode): Promise<StereoWebAudioSubNode> {
    return new StereoWebAudioSubNode(owner);
}

/** @internal */
export class StereoWebAudioSubNode extends StereoAudioSubNode {
    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(owner: IWebAudioParentNode) {
        super(owner);

        this.node = new StereoPannerNode(owner.audioContext);
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
    public setOptions(options: Nullable<IStereoAudioOptions>): void {
        if (!options) {
            return;
        }

        this.pan = options.stereoPan !== undefined ? options.stereoPan : StereoAudio.DefaultPan;
    }

    /** @internal */
    public getClassName(): string {
        return "StereoWebAudioSubNode";
    }
}
