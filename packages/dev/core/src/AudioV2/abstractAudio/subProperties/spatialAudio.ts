import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { AudioSubNode } from "../subNodes/audioSubNode";
import type { _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import { _GetSpatialAudioSubNode, _SetSpatialAudioProperty } from "../subNodes/spatialAudioSubNode";
import { _SpatialAudioDefaults, AbstractSpatialAudio } from "./abstractSpatialAudio";

/** @internal */
export abstract class _SpatialAudio extends AbstractSpatialAudio {
    private _coneInnerAngle: number = _SpatialAudioDefaults.coneInnerAngle;
    private _coneOuterAngle: number = _SpatialAudioDefaults.coneOuterAngle;
    private _coneOuterVolume: number = _SpatialAudioDefaults.coneOuterVolume;
    private _distanceModel: DistanceModelType = _SpatialAudioDefaults.distanceModel;
    private _maxDistance: number = _SpatialAudioDefaults.maxDistance;
    private _minDistance: number = _SpatialAudioDefaults.minDistance;
    private _panningModel: PanningModelType = _SpatialAudioDefaults.panningModel;
    private _position: Vector3;
    private _rolloffFactor: number = _SpatialAudioDefaults.rolloffFactor;
    private _rotation: Vector3;
    private _rotationQuaternion: Quaternion;
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();

        const subNode = _GetSpatialAudioSubNode(subGraph);
        if (subNode) {
            this._position = subNode.position.clone();
            this._rotation = subNode.rotation.clone();
            this._rotationQuaternion = subNode.rotationQuaternion.clone();
        } else {
            this._position = _SpatialAudioDefaults.position.clone();
            this._rotation = _SpatialAudioDefaults.rotation.clone();
            this._rotationQuaternion = _SpatialAudioDefaults.rotationQuaternion.clone();

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            subGraph.createAndAddSubNodeAsync(AudioSubNode.SPATIAL);
        }

        this._subGraph = subGraph;
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return this._coneInnerAngle;
    }

    public set coneInnerAngle(value: number) {
        this._coneInnerAngle = value;
        _SetSpatialAudioProperty(this._subGraph, "coneInnerAngle", value);
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return this._coneOuterAngle;
    }

    public set coneOuterAngle(value: number) {
        this._coneOuterAngle = value;
        _SetSpatialAudioProperty(this._subGraph, "coneOuterAngle", value);
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return this._coneOuterVolume;
    }

    public set coneOuterVolume(value: number) {
        this._coneOuterVolume = value;
        _SetSpatialAudioProperty(this._subGraph, "coneOuterVolume", value);
    }

    /** @internal */
    public get distanceModel(): DistanceModelType {
        return this._distanceModel;
    }

    public set distanceModel(value: DistanceModelType) {
        this._distanceModel = value;
        _SetSpatialAudioProperty(this._subGraph, "distanceModel", value);
    }

    /** @internal */
    public get isAttached(): boolean {
        return this._subGraph.getSubNode<_SpatialAudioSubNode>(AudioSubNode.SPATIAL)?.isAttached ?? false;
    }

    /** @internal */
    public get maxDistance(): number {
        return this._maxDistance;
    }

    public set maxDistance(value: number) {
        if (value <= 0) {
            value = 0.000001;
        }

        this._maxDistance = value;
        _SetSpatialAudioProperty(this._subGraph, "maxDistance", value);
    }

    /** @internal */
    public get minDistance(): number {
        return this._minDistance;
    }

    public set minDistance(value: number) {
        this._minDistance = value;
        _SetSpatialAudioProperty(this._subGraph, "minDistance", value);
    }

    /** @internal */
    public get panningModel(): PanningModelType {
        return this._panningModel;
    }

    public set panningModel(value: PanningModelType) {
        this._panningModel = value;
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
    public get rolloffFactor(): number {
        return this._rolloffFactor;
    }

    public set rolloffFactor(value: number) {
        this._rolloffFactor = value;
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
     * Attaches to a scene node.
     *
     * Detaches automatically before attaching to the given scene node.
     * If `sceneNode` is `null` it is the same as calling `detach()`.
     *
     * @param sceneNode The scene node to attach to, or `null` to detach.
     * @param useBoundingBox Whether to use the bounding box of the node for positioning. Defaults to `false`.
     * @param attachmentType Whether to attach to the node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public attach(sceneNode: Nullable<Node>, useBoundingBox: boolean = false, attachmentType: SpatialAudioAttachmentType = SpatialAudioAttachmentType.PositionAndRotation): void {
        _GetSpatialAudioSubNode(this._subGraph)?.attach(sceneNode, useBoundingBox, attachmentType);
    }

    /**
     * Detaches from the scene node if attached.
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
            subNode._updatePosition();
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
            subNode._updateRotation();
        } else if (!subNode.rotation.equalsWithEpsilon(this._rotation)) {
            subNode.rotation.copyFrom(this._rotation);
            subNode._updateRotation();
        }
    }
}
