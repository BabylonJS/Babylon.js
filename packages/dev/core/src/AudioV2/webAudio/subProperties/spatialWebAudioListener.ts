import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioListener } from "../../abstractAudio/subProperties/spatialAudioListener";
import type { _WebAudioEngine } from "../webAudioEngine";

const TmpMatrix = Matrix.Zero();
const TmpQuaternion = new Quaternion();
const TmpVector = Vector3.Zero();

/** @internal */
export function _CreateSpatialAudioListener(engine: _WebAudioEngine, autoUpdate: boolean): _SpatialAudioListener {
    return new _SpatialWebAudioListener(engine, autoUpdate);
}

/**
 * This sub property is not backed by a sub node and all properties are set directly on the audio context listener.
 *
 * @internal
 */
class _SpatialWebAudioListener extends _SpatialAudioListener {
    private _audioContext: AudioContext;
    private _autoUpdate: boolean = false;
    private _lastPosition: Vector3 = Vector3.Zero();
    private _lastRotation: Vector3 = Vector3.Zero();
    private _lastRotationQuaternion: Quaternion = new Quaternion();
    private _position: Vector3 = Vector3.Zero();
    private _rotation: Vector3 = Vector3.Zero();
    private _rotationQuaternion: Quaternion = new Quaternion();

    /** @internal */
    public constructor(engine: _WebAudioEngine, autoUpdate: boolean) {
        super();

        this._audioContext = engine.audioContext;

        if (!autoUpdate) {
            return;
        }

        this._autoUpdate = true;

        const update = () => {
            if (!this._autoUpdate) {
                return;
            }

            this.update();
            requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
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

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._autoUpdate = false;
    }

    /** @internal */
    public update(): void {
        this._updatePosition();
        this._updateRotation();
    }

    private _updatePosition(): void {
        if (this._lastPosition.equalsWithEpsilon(this._position)) {
            return;
        }

        const listener = this._audioContext.listener;
        listener.positionX.value = this._position.x;
        listener.positionY.value = this._position.y;
        listener.positionZ.value = this._position.z;

        this._lastPosition.copyFrom(this._position);
    }

    private _updateRotation(): void {
        if (!this._lastRotationQuaternion.equalsWithEpsilon(this._rotationQuaternion)) {
            TmpQuaternion.copyFrom(this._rotationQuaternion);
            this._lastRotationQuaternion.copyFrom(this._rotationQuaternion);
        } else if (!this._lastRotation.equalsWithEpsilon(this._rotation)) {
            Quaternion.FromEulerAnglesToRef(this._rotation.x, this._rotation.y, this._rotation.z, TmpQuaternion);
            this._lastRotation.copyFrom(this._rotation);
        } else {
            return;
        }

        Matrix.FromQuaternionToRef(TmpQuaternion, TmpMatrix);
        const listener = this._audioContext.listener;

        Vector3.TransformNormalToRef(Vector3.Forward(), TmpMatrix, TmpVector);
        listener.forwardX.value = TmpVector.x;
        listener.forwardY.value = TmpVector.y;
        listener.forwardZ.value = TmpVector.z;

        Vector3.TransformNormalToRef(Vector3.Up(), TmpMatrix, TmpVector);
        listener.upX.value = TmpVector.x;
        listener.upY.value = TmpVector.y;
        listener.upZ.value = TmpVector.z;
    }
}
