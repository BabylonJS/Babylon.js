import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioListener } from "../../abstractAudio/subProperties/spatialAudioListener";
import { _SpatialWebAudioUpdaterComponent } from "../components/spatialWebAudioUpdaterComponent";
import type { _WebAudioEngine } from "../webAudioEngine";

const TmpMatrix = Matrix.Zero();
const TmpQuaternion = new Quaternion();
const TmpVector = Vector3.Zero();

/** @internal */
export function _CreateSpatialAudioListener(engine: _WebAudioEngine, autoUpdate: boolean, minUpdateTime: number): _SpatialAudioListener {
    return new _SpatialWebAudioListener(engine, autoUpdate, minUpdateTime);
}

/**
 * This sub property is not backed by a sub node and all properties are set directly on the audio context listener.
 *
 * @internal
 */
class _SpatialWebAudioListener extends _SpatialAudioListener {
    private _audioContext: AudioContext;
    private _lastPosition: Vector3 = Vector3.Zero();
    private _lastRotation: Vector3 = Vector3.Zero();
    private _lastRotationQuaternion: Quaternion = new Quaternion();
    private _updaterComponent: _SpatialWebAudioUpdaterComponent;

    /** @internal */
    public readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly position: Vector3 = Vector3.Zero();
    /** @internal */
    public readonly rotation: Vector3 = Vector3.Zero();
    /** @internal */
    public readonly rotationQuaternion: Quaternion = new Quaternion();

    /** @internal */
    public constructor(engine: _WebAudioEngine, autoUpdate: boolean, minUpdateTime: number) {
        super();

        this.engine = engine;

        this._audioContext = engine._audioContext;
        this._updaterComponent = new _SpatialWebAudioUpdaterComponent(this, autoUpdate, minUpdateTime);
    }

    /** @internal */
    public get minUpdateTime(): number {
        return this._updaterComponent.minUpdateTime;
    }

    /** @internal */
    public set minUpdateTime(value: number) {
        this._updaterComponent.minUpdateTime = value;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._updaterComponent.dispose();
        this._updaterComponent = null!;
    }

    /** @internal */
    public update(): void {
        if (this.isAttached) {
            this._attacherComponent?.update();
        } else {
            this._updatePosition();
            this._updateRotation();
        }
    }

    /** @internal */
    public _updatePosition(): void {
        if (this._lastPosition.equalsWithEpsilon(this.position)) {
            return;
        }

        const listener = this._audioContext.listener;

        this.engine._setAudioParam(listener.positionX, this.position.x);
        this.engine._setAudioParam(listener.positionY, this.position.y);
        this.engine._setAudioParam(listener.positionZ, this.position.z);

        this._lastPosition.copyFrom(this.position);
    }

    /** @internal */
    public _updateRotation(): void {
        if (!this._lastRotationQuaternion.equalsWithEpsilon(this.rotationQuaternion)) {
            TmpQuaternion.copyFrom(this.rotationQuaternion);
            this._lastRotationQuaternion.copyFrom(this.rotationQuaternion);
        } else if (!this._lastRotation.equalsWithEpsilon(this.rotation)) {
            Quaternion.FromEulerAnglesToRef(this.rotation.x, this.rotation.y, this.rotation.z, TmpQuaternion);
            this._lastRotation.copyFrom(this.rotation);
        } else {
            return;
        }

        Matrix.FromQuaternionToRef(TmpQuaternion, TmpMatrix);
        const listener = this._audioContext.listener;

        // NB: The WebAudio API is right-handed.
        Vector3.TransformNormalToRef(Vector3.RightHandedForwardReadOnly, TmpMatrix, TmpVector);
        this.engine._setAudioParam(listener.forwardX, TmpVector.x);
        this.engine._setAudioParam(listener.forwardY, TmpVector.y);
        this.engine._setAudioParam(listener.forwardZ, TmpVector.z);

        Vector3.TransformNormalToRef(Vector3.Up(), TmpMatrix, TmpVector);
        this.engine._setAudioParam(listener.upX, TmpVector.x);
        this.engine._setAudioParam(listener.upY, TmpVector.y);
        this.engine._setAudioParam(listener.upZ, TmpVector.z);
    }
}
