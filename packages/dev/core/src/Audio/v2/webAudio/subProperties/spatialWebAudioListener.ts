import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import { AbstractSpatialAudioListener } from "../../abstract/subProperties/abstractSpatialAudioListener";
import type { _WebAudioEngine } from "../webAudioEngine";

const TempMatrix = new Matrix();
const TempQuaternion = new Quaternion();
const TempVector = new Vector3();

/** @internal */
export function _CreateSpatialAudioListener(engine: _WebAudioEngine): AbstractSpatialAudioListener {
    return new _SpatialWebAudioListener(engine);
}

/**
 * This sub property is not backed by a sub node and all properties are set directly on the audio context listener.
 *
 * @internal
 */
class _SpatialWebAudioListener extends AbstractSpatialAudioListener {
    private _audioContext: AudioContext;
    private _position: Vector3 = Vector3.Zero();
    private _rotationAngles: Vector3 = Vector3.Zero();
    private _rotationAnglesDirty = false;
    private _rotationQuaternion: Quaternion = Quaternion.FromEulerVector(this._rotationAngles);

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
        this._audioContext.listener.positionX.value = this._position.x = value.x;
        this._audioContext.listener.positionY.value = this._position.y = value.y;
        this._audioContext.listener.positionZ.value = this._position.z = value.z;
    }

    /** @internal */
    public get rotation(): Vector3 {
        if (this._rotationAnglesDirty) {
            this._rotationAnglesDirty = false;
            this._rotationQuaternion.toEulerAnglesToRef(this._rotationAngles);
        }

        return this._rotationAngles;
    }

    public set rotation(value: Vector3) {
        Quaternion.FromEulerAnglesToRef(value.x, value.y, value.z, TempQuaternion);
        this.rotationQuaternion = TempQuaternion;
        this._rotationAnglesDirty = true;
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._rotationQuaternion.copyFrom(value);

        const mat = Matrix.FromQuaternionToRef(value, TempMatrix);

        const forward = Vector3.TransformNormalToRef(Vector3.Forward(), mat, TempVector);
        this._audioContext.listener.forwardX.value = forward.x;
        this._audioContext.listener.forwardY.value = forward.y;
        this._audioContext.listener.forwardZ.value = forward.z;

        const up = Vector3.TransformNormalToRef(Vector3.Up(), mat, TempVector);
        this._audioContext.listener.upX.value = up.x;
        this._audioContext.listener.upY.value = up.y;
        this._audioContext.listener.upZ.value = up.z;
    }
}
