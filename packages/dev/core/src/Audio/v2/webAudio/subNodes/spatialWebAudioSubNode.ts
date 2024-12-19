import { SpatialAudioSubNode } from "../../subNodes/spatialAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInputNode } from "../webAudioNode";

/** @internal */
export async function _CreateSpatialAudioSubNodeAsync(engine: _WebAudioEngine): Promise<SpatialAudioSubNode> {
    return new SpatialWebAudioSubNode(engine);
}

/** @internal */
class SpatialWebAudioSubNode extends SpatialAudioSubNode {
    /** @internal */
    public readonly node: PannerNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new PannerNode(engine.audioContext);
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return this.node.coneInnerAngle;
    }

    /** @internal */
    public set coneInnerAngle(value: number) {
        this.node.coneInnerAngle = value;
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return this.node.coneOuterAngle;
    }

    /** @internal */
    public set coneOuterAngle(value: number) {
        this.node.coneOuterAngle = value;
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return this.node.coneOuterGain;
    }

    /** @internal */
    public set coneOuterVolume(value: number) {
        this.node.coneOuterGain = value;
    }

    /** @internal */
    public get distanceModel(): "linear" | "inverse" | "exponential" {
        return this.node.distanceModel;
    }

    /** @internal */
    public set distanceModel(value: "linear" | "inverse" | "exponential") {
        this.node.distanceModel = value;
    }

    /** @internal */
    public get maxDistance(): number {
        return this.node.maxDistance;
    }

    /** @internal */
    public set maxDistance(value: number) {
        this.node.maxDistance = value;
    }

    /** @internal */
    public get panningModel(): "equalpower" | "HRTF" {
        return this.node.panningModel;
    }

    /** @internal */
    public set panningModel(value: "equalpower" | "HRTF") {
        this.node.panningModel = value;
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
        return "SpatialWebAudioSubNode";
    }
}
