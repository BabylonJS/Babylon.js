import type { Nullable } from "core/types";
import { SpatialAudioSubNode, type ISpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import type { IWebAudioNode } from "../webAudioNode";
import type { IWebAudioSuperNode } from "../webAudioParentNode";

/** @internal */
export async function _CreateSpatialAudioSubNodeAsync(owner: IWebAudioSuperNode, options: Nullable<ISpatialAudioOptions> = null): Promise<_SpatialWebAudioSubNode> {
    return new _SpatialWebAudioSubNode(owner, options);
}

/** @internal */
export class _SpatialWebAudioSubNode extends SpatialAudioSubNode {
    /** @internal */
    public readonly node: PannerNode;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode, options: Nullable<ISpatialAudioOptions>) {
        super(owner);

        this.node = new PannerNode(owner.audioContext);

        this.coneInnerAngle = options?.spatialConeInnerAngle ?? 360;
        this.coneOuterAngle = options?.spatialConeOuterAngle ?? 360;
        this.coneOuterVolume = options?.spatialConeOuterVolume ?? 0;
        this.distanceModel = options?.spatialDistanceModel ?? "inverse";
        this.maxDistance = options?.spatialMaxDistance ?? 10000;
        this.panningModel = options?.spatialPanningModel ?? "equalpower";

        owner.addSubNode(this);
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
    public getClassName(): string {
        return "SpatialWebAudioSubNode";
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
