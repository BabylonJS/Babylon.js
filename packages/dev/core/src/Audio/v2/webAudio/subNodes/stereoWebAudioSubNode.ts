import { StereoAudioSubNode } from "../../subNodes/stereoAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInputNode } from "../webAudioNode";

/** @internal */
export async function _CreateStereoAudioSubNodeAsync(engine: _WebAudioEngine): Promise<StereoAudioSubNode> {
    return new StereoWebAudioSubNode(engine);
}

/** @internal */
class StereoWebAudioSubNode extends StereoAudioSubNode {
    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new StereoPannerNode(engine.audioContext);
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

    /** @internal */
    public getClassName(): string {
        return "StereoWebAudioSubNode";
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
}
