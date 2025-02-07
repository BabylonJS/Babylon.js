import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh, TransformNode } from "../../../Meshes";
import type { Nullable } from "../../../types";
import type { SpatialAudioAttachmentType } from "../spatial/spatialAudioAttacher";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _GetSpatialAudioProperty, _SetSpatialAudioProperty } from "../subNodes/spatialAudioSubNode";
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
        return _GetSpatialAudioProperty(this._subGraph, "coneInnerAngle");
    }

    public set coneInnerAngle(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "coneInnerAngle", value);
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return _GetSpatialAudioProperty(this._subGraph, "coneOuterAngle");
    }

    public set coneOuterAngle(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "coneOuterAngle", value);
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return _GetSpatialAudioProperty(this._subGraph, "coneOuterVolume");
    }

    public set coneOuterVolume(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "coneOuterVolume", value);
    }

    /** @internal */
    public get distanceModel(): DistanceModelType {
        return _GetSpatialAudioProperty(this._subGraph, "distanceModel");
    }

    public set distanceModel(value: DistanceModelType) {
        _SetSpatialAudioProperty(this._subGraph, "distanceModel", value);
    }

    /** @internal */
    public get isAttached(): boolean {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.isAttached ?? false;
    }

    /** @internal */
    public get maxDistance(): number {
        return _GetSpatialAudioProperty(this._subGraph, "maxDistance");
    }

    public set maxDistance(value: number) {
        if (value <= 0) {
            value = 0.000001;
        }

        _SetSpatialAudioProperty(this._subGraph, "maxDistance", value);
    }

    /** @internal */
    public get panningModel(): PanningModelType {
        return _GetSpatialAudioProperty(this._subGraph, "panningModel");
    }

    public set panningModel(value: PanningModelType) {
        _SetSpatialAudioProperty(this._subGraph, "panningModel", value);
    }

    /** @internal */
    public get position(): Vector3 {
        return _GetSpatialAudioProperty(this._subGraph, "position");
    }

    public set position(value: Vector3) {
        _SetSpatialAudioProperty(this._subGraph, "position", value);
    }

    /** @internal */
    public get referenceDistance(): number {
        return _GetSpatialAudioProperty(this._subGraph, "referenceDistance");
    }

    public set referenceDistance(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "referenceDistance", value);
    }

    /** @internal */
    public get rolloffFactor(): number {
        return _GetSpatialAudioProperty(this._subGraph, "rolloffFactor");
    }

    public set rolloffFactor(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "rolloffFactor", value);
    }

    /** @internal */
    public get rotation(): Vector3 {
        return _GetSpatialAudioProperty(this._subGraph, "rotation");
    }

    public set rotation(value: Vector3) {
        _SetSpatialAudioProperty(this._subGraph, "rotation", value);
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return _GetSpatialAudioProperty(this._subGraph, "rotationQuaternion");
    }

    public set rotationQuaternion(value: Quaternion) {
        _SetSpatialAudioProperty(this._subGraph, "rotationQuaternion", value);
    }

    /**
     * Detaches the audio source from the currently attached camera, mesh or transform node.
     */
    public detach(): void {
        this._subGraph.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.detach();
    }
}
