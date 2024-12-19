import type { Nullable } from "../../../../types";
import { SpatialAudio, SpatialAudioSubNode, type ISpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import type { IWebAudioInputNode } from "../webAudioInputNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";

/** @internal */
export async function _CreateSpatialAudioSubNodeAsync(owner: IWebAudioParentNode): Promise<SpatialWebAudioSubNode> {
    return new SpatialWebAudioSubNode(owner);
}

/** @internal */
export class SpatialWebAudioSubNode extends SpatialAudioSubNode {
    /** @internal */
    public readonly node: PannerNode;

    /** @internal */
    public constructor(owner: IWebAudioParentNode) {
        super(owner);

        this.node = new PannerNode(owner.audioContext);
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
    public setOptions(options: Nullable<ISpatialAudioOptions>): void {
        if (!options) {
            return;
        }

        this.coneInnerAngle = options.spatialConeInnerAngle !== undefined ? options.spatialConeInnerAngle : SpatialAudio.DefaultConeInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle !== undefined ? options.spatialConeOuterAngle : SpatialAudio.DefaultConeOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume !== undefined ? options.spatialConeOuterVolume : SpatialAudio.DefaultConeOuterVolume;
        this.distanceModel = options.spatialDistanceModel !== undefined ? options.spatialDistanceModel : SpatialAudio.DefaultDistanceModel;
        this.maxDistance = options.spatialMaxDistance !== undefined ? options.spatialMaxDistance : SpatialAudio.DefaultMaxDistance;
        this.panningModel = options.spatialPanningModel !== undefined ? options.spatialPanningModel : SpatialAudio.DefaultPanningModel;
    }

    /** @internal */
    public getClassName(): string {
        return "SpatialWebAudioSubNode";
    }
}
