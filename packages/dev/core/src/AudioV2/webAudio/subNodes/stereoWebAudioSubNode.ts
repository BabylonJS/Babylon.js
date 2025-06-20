import { _StereoAudioSubNode } from "../../abstractAudio/subNodes/stereoAudioSubNode";
import { _WebAudioParameterComponent } from "../components/webAudioParameterComponent";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

/** @internal */
// eslint-disable-next-line @typescript-eslint/require-await
export async function _CreateStereoAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_StereoAudioSubNode> {
    return new _StereoWebAudioSubNode(engine);
}

/** @internal */
export class _StereoWebAudioSubNode extends _StereoAudioSubNode {
    private _pan: _WebAudioParameterComponent;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly node: StereoPannerNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new StereoPannerNode(engine._audioContext);

        this._pan = new _WebAudioParameterComponent(engine, this.node.pan);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._pan.dispose();
    }

    /** @internal */
    public get pan(): number {
        return this._pan.targetValue;
    }

    /** @internal */
    public set pan(value: number) {
        this._pan.targetValue = value;
    }

    /** @internal */
    public get _inNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get _outNode(): AudioNode {
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
        if (node._inNode) {
            this.node.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node._inNode) {
            this.node.disconnect(node._inNode);
        }

        return true;
    }
}
