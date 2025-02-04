import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioListener } from "../../abstractAudio/subProperties/spatialAudioListener";
import type { _WebAudioEngine } from "../webAudioEngine";

const TmpMatrix = Matrix.Zero();
const TmpQuaternion = Quaternion.Zero();
const TmpVector = Vector3.Zero();

/** @internal */
export function _CreateSpatialAudioListener(engine: _WebAudioEngine): _SpatialAudioListener {
    return new _SpatialWebAudioListener(engine);
}

/**
 * This sub property is not backed by a sub node and all properties are set directly on the audio context listener.
 *
 * @internal
 */
class _SpatialWebAudioListener extends _SpatialAudioListener {
    private _audioContext: AudioContext;
    private _position: Vector3 = Vector3.Zero();
    private _rotation: Vector3 = Vector3.Zero();
    private _rotationDirty = false;
    private _rotationQuaternion: Quaternion = Quaternion.FromEulerVector(this._rotation);

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super();

        this._audioContext = engine.audioContext;
    }

    /** @internal */
    public get position(): Vector3 {
        return this._position;
    }

    public set position(value: Vector3) {
        this._position.copyFrom(value);

        const listener = this._audioContext.listener;
        listener.positionX.value = value.x;
        listener.positionY.value = value.y;
        listener.positionZ.value = value.z;
    }

    /** @internal */
    public get rotation(): Vector3 {
        if (this._rotationDirty) {
            this._rotationQuaternion.toEulerAnglesToRef(this._rotation);
            this._rotationDirty = false;
        }

        return this._rotation;
    }

    public set rotation(value: Vector3) {
        this.rotationQuaternion = Quaternion.FromEulerAnglesToRef(value.x, value.y, value.z, TmpQuaternion);
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._rotationQuaternion.copyFrom(value);
        this._rotationDirty = true;

        Matrix.FromQuaternionToRef(value, TmpMatrix);
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
