import type { Vector3, Quaternion } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "../subNodes/audioSubNode";
import type { _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import { _SpatialAudioDefault } from "../subNodes/spatialAudioSubNode";
import { AbstractSpatialAudio } from "./abstractSpatialAudio";

/** @internal */
export class _SpatialAudio extends AbstractSpatialAudio {
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();
        this._subGraph = subGraph;
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.coneInnerAngle ?? _SpatialAudioDefault.ConeInnerAngle;
    }

    public set coneInnerAngle(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.coneInnerAngle = value;
        });
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.coneOuterAngle ?? _SpatialAudioDefault.ConeOuterAngle;
    }

    public set coneOuterAngle(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.coneOuterAngle = value;
        });
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.coneOuterVolume ?? _SpatialAudioDefault.ConeOuterVolume;
    }

    public set coneOuterVolume(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.coneOuterVolume = value;
        });
    }

    /** @internal */
    public get distanceModel(): "linear" | "inverse" | "exponential" {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.distanceModel ?? _SpatialAudioDefault.DistanceModel;
    }

    public set distanceModel(value: "linear" | "inverse" | "exponential") {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.distanceModel = value;
        });
    }

    /** @internal */
    public get maxDistance(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.maxDistance ?? _SpatialAudioDefault.MaxDistance;
    }

    public set maxDistance(value: number) {
        if (value <= 0) {
            value = 0.000001;
        }

        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.maxDistance = value;
        });
    }

    /** @internal */
    public get panningModel(): "equalpower" | "HRTF" {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.panningModel ?? _SpatialAudioDefault.PanningModel;
    }

    public set panningModel(value: "equalpower" | "HRTF") {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.panningModel = value;
        });
    }

    /** @internal */
    public get position(): Vector3 {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.position ?? _SpatialAudioDefault.Position;
    }

    public set position(value: Vector3) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.position = value;
        });
    }

    /** @internal */
    public get referenceDistance(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.referenceDistance ?? _SpatialAudioDefault.ReferenceDistance;
    }

    public set referenceDistance(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.referenceDistance = value;
        });
    }

    /** @internal */
    public get rolloffFactor(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.rolloffFactor ?? _SpatialAudioDefault.RolloffFactor;
    }

    public set rolloffFactor(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.rolloffFactor = value;
        });
    }

    /** @internal */
    public get rotation(): Vector3 {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.rotation ?? _SpatialAudioDefault.Rotation;
    }

    public set rotation(value: Vector3) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.rotation = value;
        });
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.rotationQuaternion ?? _SpatialAudioDefault.RotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.rotationQuaternion = value;
        });
    }

    /** @internal */
    public get transformNode(): Nullable<TransformNode> {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.transformNode ?? null;
    }

    public set transformNode(value: Nullable<TransformNode>) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial, (node) => {
            node.transformNode = value;
        });
    }
}
