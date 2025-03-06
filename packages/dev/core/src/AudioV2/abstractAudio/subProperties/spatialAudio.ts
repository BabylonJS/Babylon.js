import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { AudioSubNode } from "../subNodes/audioSubNode";
import type { _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import { _GetSpatialAudioProperty, _GetSpatialAudioSubNode, _SetSpatialAudioProperty } from "../subNodes/spatialAudioSubNode";
import { _SpatialAudioDefaults, AbstractSpatialAudio } from "./abstractSpatialAudio";

/** @internal */
export abstract class _SpatialAudio extends AbstractSpatialAudio {
    private _position: Vector3;
    private _rotation: Vector3;
    private _rotationQuaternion: Quaternion;
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();

        const subNode = _GetSpatialAudioSubNode(subGraph);
        if (!subNode) {
            throw new Error("Sub node not found");
        }

        this._position = subNode.position.clone();
        this._rotation = subNode.rotation.clone();
        this._rotationQuaternion = subNode.rotationQuaternion.clone();

        this._subGraph = subGraph;
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return _GetSpatialAudioProperty(this._subGraph, "coneInnerAngle") ?? _SpatialAudioDefaults.coneInnerAngle;
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
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(AudioSubNode.SPATIAL)?.isAttached ?? false;
    }

    /** @internal */
    public get maxDistance(): number {
        return _GetSpatialAudioProperty(this._subGraph, "maxDistance") ?? _SpatialAudioDefaults.maxDistance;
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
        return this._position;
    }

    public set position(value: Vector3) {
        this._position = value;
        this._updatePosition();
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
        return this._rotation;
    }

    public set rotation(value: Vector3) {
        this._rotation = value;
        this._updateRotation();
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._rotationQuaternion = value;
        this._updateRotation();
    }

    /**
     * Attaches the audio source to a scene object.
     * @param sceneNode The scene node to attach the audio source to.
     * @param useBoundingBox Whether to use the bounding box of the node for positioning. Defaults to `false`.
     * @param attachmentType Whather to attach to the node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public attach(sceneNode: Node, useBoundingBox: boolean = false, attachmentType: SpatialAudioAttachmentType = SpatialAudioAttachmentType.PositionAndRotation): void {
        _GetSpatialAudioSubNode(this._subGraph)?.attach(sceneNode, useBoundingBox, attachmentType);
    }

    /**
     * Detaches the audio source from the currently attached graphics node.
     */
    public detach(): void {
        _GetSpatialAudioSubNode(this._subGraph)?.detach();
    }

    /** @internal */
    public update(): void {
        const subNode = _GetSpatialAudioSubNode(this._subGraph);

        if (!subNode) {
            return;
        }

        if (subNode.isAttached) {
            subNode.update();
        } else {
            this._updatePosition(subNode);
            this._updateRotation(subNode);
        }
    }

    private _updatePosition(subNode: Nullable<_SpatialAudioSubNode> = null): void {
        if (!subNode) {
            subNode = _GetSpatialAudioSubNode(this._subGraph);

            if (!subNode) {
                return;
            }
        }

        const position = subNode.position;
        if (!position.equalsWithEpsilon(this._position)) {
            subNode.position.copyFrom(this._position);
            subNode.updatePosition();
        }
    }

    private _updateRotation(subNode: Nullable<_SpatialAudioSubNode> = null): void {
        if (!subNode) {
            subNode = _GetSpatialAudioSubNode(this._subGraph);

            if (!subNode) {
                return;
            }
        }

        if (!subNode.rotationQuaternion.equalsWithEpsilon(this._rotationQuaternion)) {
            subNode.rotationQuaternion.copyFrom(this._rotationQuaternion);
            subNode.updateRotation();
        } else if (!subNode.rotation.equalsWithEpsilon(this._rotation)) {
            subNode.rotation.copyFrom(this._rotation);
            subNode.updateRotation();
        }
    }
}
