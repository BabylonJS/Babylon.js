import { _StereoAudioSubNode } from "../../abstractAudio/subNodes/stereoAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

/** @internal */
export async function _CreateStereoAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_StereoAudioSubNode> {
    return new _StereoWebAudioSubNode(engine);
}

/** @internal */
export class _StereoWebAudioSubNode extends _StereoAudioSubNode {
    private _pan: number = 0;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new StereoPannerNode(engine.audioContext);
    }

    /** @internal */
    public get pan(): number {
        return this._pan;
    }

    /** @internal */
    public set pan(value: number) {
        this._pan = value;
        this.engine._setAudioParam(this.node.pan, value);
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
        return "_StereoWebAudioSubNode";
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node.inNode) {
            this.node.connect(node.inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node.inNode) {
            this.node.disconnect(node.inNode);
        }

        return true;
    }
}
