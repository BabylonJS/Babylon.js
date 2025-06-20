import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioListener } from "../../abstractAudio/subProperties/spatialAudioListener";
import { _SpatialWebAudioUpdaterComponent } from "../components/spatialWebAudioUpdaterComponent";
import { _WebAudioParameterComponent } from "../components/webAudioParameterComponent";
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
    private _lastPosition: Vector3 = Vector3.Zero();
    private _lastRotation: Vector3 = Vector3.Zero();
    private _lastRotationQuaternion: Quaternion = new Quaternion();
    private _updaterComponent: _SpatialWebAudioUpdaterComponent;

    private _forwardX: _WebAudioParameterComponent;
    private _forwardY: _WebAudioParameterComponent;
    private _forwardZ: _WebAudioParameterComponent;
    private _positionX: _WebAudioParameterComponent;
    private _positionY: _WebAudioParameterComponent;
    private _positionZ: _WebAudioParameterComponent;
    private _upX: _WebAudioParameterComponent;
    private _upY: _WebAudioParameterComponent;
    private _upZ: _WebAudioParameterComponent;

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

        this._updaterComponent = new _SpatialWebAudioUpdaterComponent(this, autoUpdate, minUpdateTime);

        const listener = engine._audioContext.listener;
        this._forwardX = new _WebAudioParameterComponent(engine, listener.forwardX);
        this._forwardY = new _WebAudioParameterComponent(engine, listener.forwardY);
        this._forwardZ = new _WebAudioParameterComponent(engine, listener.forwardZ);
        this._positionX = new _WebAudioParameterComponent(engine, listener.positionX);
        this._positionY = new _WebAudioParameterComponent(engine, listener.positionY);
        this._positionZ = new _WebAudioParameterComponent(engine, listener.positionZ);
        this._upX = new _WebAudioParameterComponent(engine, listener.upX);
        this._upY = new _WebAudioParameterComponent(engine, listener.upY);
        this._upZ = new _WebAudioParameterComponent(engine, listener.upZ);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._forwardX.dispose();
        this._forwardY.dispose();
        this._forwardZ.dispose();
        this._positionX.dispose();
        this._positionY.dispose();
        this._positionZ.dispose();
        this._upX.dispose();
        this._upY.dispose();
        this._upZ.dispose();

        this._updaterComponent.dispose();
        this._updaterComponent = null!;
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

        this._positionX.targetValue = this.position.x;
        this._positionY.targetValue = this.position.y;
        this._positionZ.targetValue = this.position.z;

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

        // NB: The WebAudio API is right-handed.
        Vector3.TransformNormalToRef(Vector3.RightHandedForwardReadOnly, TmpMatrix, TmpVector);
        this._forwardX.targetValue = TmpVector.x;
        this._forwardY.targetValue = TmpVector.y;
        this._forwardZ.targetValue = TmpVector.z;

        Vector3.TransformNormalToRef(Vector3.Up(), TmpMatrix, TmpVector);
        this._upX.targetValue = TmpVector.x;
        this._upY.targetValue = TmpVector.y;
        this._upZ.targetValue = TmpVector.z;
    }
}
