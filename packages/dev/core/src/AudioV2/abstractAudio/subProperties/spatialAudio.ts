import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh, TransformNode } from "../../../Meshes";
import type { Nullable } from "../../../types";
import type { SpatialAudioAttachmentType } from "../spatial/spatialAudioAttacher";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "../subNodes/audioSubNode";
import type { _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import { _SpatialAudioDefaults, AbstractSpatialAudio } from "./abstractSpatialAudio";

/** @internal */
export class _SpatialAudio extends AbstractSpatialAudio {
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();

        this._subGraph = subGraph;
    }

    /** @internal */
    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.attachedMesh ?? null;
    }

    public set attachedMesh(value: Nullable<AbstractMesh>) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.attachedMesh = value;
        });
    }

    /** @internal */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.attachedTransformNode ?? null;
    }

    public set attachedTransformNode(value: Nullable<TransformNode>) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.attachedTransformNode = value;
        });
    }

    /** @internal */
    public get attachmentType(): SpatialAudioAttachmentType {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.attachmentType ?? _SpatialAudioDefaults.ATTACHMENT_TYPE;
    }

    public set attachmentType(value: SpatialAudioAttachmentType) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.attachmentType = value;
        });
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.coneInnerAngle ?? _SpatialAudioDefaults.CONE_INNER_ANGLE;
    }

    public set coneInnerAngle(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.coneInnerAngle = value;
        });
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.coneOuterAngle ?? _SpatialAudioDefaults.CONE_OUTER_ANGLE;
    }

    public set coneOuterAngle(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.coneOuterAngle = value;
        });
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.coneOuterVolume ?? _SpatialAudioDefaults.CONE_OUTER_VOLUME;
    }

    public set coneOuterVolume(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.coneOuterVolume = value;
        });
    }

    /** @internal */
    public get distanceModel(): "linear" | "inverse" | "exponential" {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.distanceModel ?? _SpatialAudioDefaults.DISTANCE_MODEL;
    }

    public set distanceModel(value: "linear" | "inverse" | "exponential") {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.distanceModel = value;
        });
    }

    /** @internal */
    public get maxDistance(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.maxDistance ?? _SpatialAudioDefaults.MAX_DISTANCE;
    }

    public set maxDistance(value: number) {
        if (value <= 0) {
            value = 0.000001;
        }

        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.maxDistance = value;
        });
    }

    /** @internal */
    public get panningModel(): "equalpower" | "HRTF" {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.panningModel ?? _SpatialAudioDefaults.PANNING_MODEL;
    }

    public set panningModel(value: "equalpower" | "HRTF") {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.panningModel = value;
        });
    }

    /** @internal */
    public get position(): Vector3 {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.position ?? _SpatialAudioDefaults.POSITION;
    }

    public set position(value: Vector3) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.position = value;
        });
    }

    /** @internal */
    public get referenceDistance(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.referenceDistance ?? _SpatialAudioDefaults.REFERENCE_DISTANCE;
    }

    public set referenceDistance(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.referenceDistance = value;
        });
    }

    /** @internal */
    public get rolloffFactor(): number {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.rolloffFactor ?? _SpatialAudioDefaults.ROLLOFF_FACTOR;
    }

    public set rolloffFactor(value: number) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.rolloffFactor = value;
        });
    }

    /** @internal */
    public get rotation(): Vector3 {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.rotation ?? _SpatialAudioDefaults.ROTATION;
    }

    public set rotation(value: Vector3) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.rotation = value;
        });
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.rotationQuaternion ?? _SpatialAudioDefaults.ROTATION_QUATERNION;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._subGraph.callOnSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL, (node) => {
            node.rotationQuaternion = value;
        });
    }
}
