import type { Vector3 } from "../../../Maths/math.vector";
import { Quaternion } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _GetSpatialAudioProperty, _GetSpatialAudioSubNode, _SetSpatialAudioProperty, type _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import { _SpatialAudioDefaults, AbstractSpatialAudio } from "./abstractSpatialAudio";

/** @internal */
export class _SpatialAudio extends AbstractSpatialAudio {
    private _position: Vector3 = _SpatialAudioDefaults.position.clone();
    private _rotation: Vector3 = _SpatialAudioDefaults.rotation.clone();
    private _rotationQuaternion: Quaternion = _SpatialAudioDefaults.rotationQuaternion.clone();
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();
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
        return _GetSpatialAudioProperty(this._subGraph, "coneOuterAngle") ?? _SpatialAudioDefaults.coneOuterAngle;
    }

    public set coneOuterAngle(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "coneOuterAngle", value);
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return _GetSpatialAudioProperty(this._subGraph, "coneOuterVolume") ?? _SpatialAudioDefaults.coneOuterVolume;
    }

    public set coneOuterVolume(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "coneOuterVolume", value);
    }

    /** @internal */
    public get distanceModel(): DistanceModelType {
        return _GetSpatialAudioProperty(this._subGraph, "distanceModel") ?? _SpatialAudioDefaults.distanceModel;
    }

    public set distanceModel(value: DistanceModelType) {
        _SetSpatialAudioProperty(this._subGraph, "distanceModel", value);
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
        return _GetSpatialAudioProperty(this._subGraph, "panningModel") ?? _SpatialAudioDefaults.panningModel;
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
        return _GetSpatialAudioProperty(this._subGraph, "referenceDistance") ?? _SpatialAudioDefaults.referenceDistance;
    }

    public set referenceDistance(value: number) {
        _SetSpatialAudioProperty(this._subGraph, "referenceDistance", value);
    }

    /** @internal */
    public get rolloffFactor(): number {
        return _GetSpatialAudioProperty(this._subGraph, "rolloffFactor") ?? _SpatialAudioDefaults.rolloffFactor;
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
        this._updateRotationQuaternion();
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._rotationQuaternion = value;
        this._updateRotationQuaternion();
    }

    /** @internal */
    public update(): void {
        this._updatePosition();
        this._updateRotationQuaternion();
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
            subNode.position = this._position;
        }
    }

    private _updateRotationQuaternion(subNode: Nullable<_SpatialAudioSubNode> = null): void {
        if (!subNode) {
            subNode = _GetSpatialAudioSubNode(this._subGraph);

            if (!subNode) {
                return;
            }
        }

        if (this._rotation._isDirty) {
            Quaternion.FromEulerAnglesToRef(this._rotation.x, this._rotation.y, this._rotation.z, this._rotationQuaternion);

            this._rotation._isDirty = false;
        }

        if (this._rotationQuaternion._isDirty) {
            subNode.rotationQuaternion = this._rotationQuaternion;

            this._rotationQuaternion.toEulerAnglesToRef(this._rotation);

            this._rotationQuaternion._isDirty = false;
            this._rotation._isDirty = false;
        }
    }
}
