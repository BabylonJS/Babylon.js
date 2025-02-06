import { _StereoAudioSubNode } from "../../abstractAudio/subNodes/stereoAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

/** @internal */
export async function _CreateStereoAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_StereoAudioSubNode> {
    return new _StereoWebAudioSubNode(engine);
}

/** @internal */
export class _StereoWebAudioSubNode extends _StereoAudioSubNode {
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
    public get inNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get outNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public getClassName(): string {
        return "StereoWebAudioSubNode";
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
}
