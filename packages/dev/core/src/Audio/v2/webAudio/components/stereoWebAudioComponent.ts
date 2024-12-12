import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import type { IStereoAudioOptions } from "../../components/stereoAudioComponent";
import { StereoAudioComponent } from "../../components/stereoAudioComponent";
import type { IWebAudioComponentOwner } from "../webAudioComponentOwner";

/** @internal */
export async function _CreateStereoAudioComponentAsync(owner: IWebAudioComponentOwner, options: Nullable<IStereoAudioOptions> = null): Promise<_StereoWebAudioComponent> {
    return new _StereoWebAudioComponent(owner, options);
}

/** @internal */
export class _StereoWebAudioComponent extends StereoAudioComponent {
    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(owner: IWebAudioComponentOwner, options: Nullable<IStereoAudioOptions>) {
        super(owner);

        this.node = new StereoPannerNode(owner.audioContext);

        this.pan = options?.stereoPan ?? 0;

        owner.addComponent(this);
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
        return "StereoWebAudioComponent";
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this.node;
    }

    protected override _connect(node: AbstractAudioNode): void {
        if ("webAudioInputNode" in node) {
            this.node.connect(node.webAudioInputNode as AudioNode);
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        if ("webAudioInputNode" in node) {
            this.node.disconnect(node.webAudioInputNode as AudioNode);
        }
    }
}
