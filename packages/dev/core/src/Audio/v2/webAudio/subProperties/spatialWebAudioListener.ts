import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { TransformNode } from "../../../../Meshes/transformNode";
import type { Nullable } from "../../../../types";
import { AbstractSpatialAudioListener } from "../../subProperties/abstractSpatialAudioListener";
import type { _WebAudioEngine } from "../webAudioEngine";

const TempMatrix = new Matrix();
const TempVector = new Vector3();

/** @internal */
export async function _CreateSpatialAudioListenerAsync(engine: _WebAudioEngine): Promise<AbstractSpatialAudioListener> {
    return new _SpatialWebAudioListener(engine);
}

/** @internal */
class _SpatialWebAudioListener extends AbstractSpatialAudioListener {
    private _audioContext: AudioContext;
    private _position: Vector3 = Vector3.Zero();
    private _rotation: Vector3 = Vector3.Zero();
    private _rotationQuaternion: Quaternion = Quaternion.FromEulerVector(this._rotation);
    private _rotationQuaternionDirty = false;

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
        return this._rotation;
    }

    public set rotation(value: Vector3) {
        this._rotation.copyFrom(value);

        const mat = Matrix.RotationYawPitchRollToRef(value.y, value.x, value.z, TempMatrix);

        const forward = Vector3.TransformNormalToRef(Vector3.Forward(), mat, TempVector);
        this._audioContext.listener.forwardX.value = forward.x;
        this._audioContext.listener.forwardY.value = forward.y;
        this._audioContext.listener.forwardZ.value = forward.z;

        const up = Vector3.TransformNormalToRef(Vector3.Up(), mat, TempVector);
        this._audioContext.listener.upX.value = up.x;
        this._audioContext.listener.upY.value = up.y;
        this._audioContext.listener.upZ.value = up.z;

        this._rotationQuaternionDirty = true;
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        if (this._rotationQuaternionDirty) {
            Quaternion.FromEulerVectorToRef(this._rotation, this._rotationQuaternion);
            this._rotationQuaternionDirty = false;
        }
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this.rotation = value.toEulerAnglesToRef(TempVector);
    }

    /** @internal */
    public get transformNode(): Nullable<TransformNode> {
        // TODO: Implement `transformNode` property.
        return null;
    }

    public set transformNode(value: Nullable<TransformNode>) {
        // TODO: Implement `transformNode` property.
    }
}
