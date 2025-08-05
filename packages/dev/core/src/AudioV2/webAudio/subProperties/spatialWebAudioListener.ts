import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioListener } from "../../abstractAudio/subProperties/spatialAudioListener";
import { _SpatialWebAudioUpdaterComponent } from "../components/spatialWebAudioUpdaterComponent";
import { _WebAudioParameterComponent } from "../components/webAudioParameterComponent";
import type { _WebAudioEngine } from "../webAudioEngine";

const TmpMatrix = Matrix.Zero();
const TmpQuaternion = new Quaternion();
const TmpVector1 = Vector3.Zero();
const TmpVector2 = Vector3.Zero();

/** @internal */
export function _CreateSpatialAudioListener(engine: _WebAudioEngine, autoUpdate: boolean, minUpdateTime: number): _SpatialAudioListener {
    const listener = engine._audioContext.listener;
    if (
        listener.forwardX &&
        listener.forwardY &&
        listener.forwardZ &&
        listener.positionX &&
        listener.positionY &&
        listener.positionZ &&
        listener.upX &&
        listener.upY &&
        listener.upZ
    ) {
        return new _SpatialWebAudioListener(engine, autoUpdate, minUpdateTime);
    } else {
        return new _SpatialWebAudioListenerFallback(engine, autoUpdate, minUpdateTime);
    }
}

abstract class _AbstractSpatialWebAudioListener extends _SpatialAudioListener {
    protected readonly _listener: AudioListener;

    protected _lastPosition: Vector3 = Vector3.Zero();
    protected _lastRotation: Vector3 = Vector3.Zero();
    protected _lastRotationQuaternion: Quaternion = new Quaternion();
    protected _updaterComponent: _SpatialWebAudioUpdaterComponent;

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

        this._listener = engine._audioContext.listener;
        this.engine = engine;

        this._updaterComponent = new _SpatialWebAudioUpdaterComponent(this, autoUpdate, minUpdateTime);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

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

    public _updatePosition(): void {
        if (this._lastPosition.equalsWithEpsilon(this.position)) {
            return;
        }

        this._setWebAudioPosition(this.position);

        this._lastPosition.copyFrom(this.position);
    }

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
        Vector3.TransformNormalToRef(Vector3.RightHandedForwardReadOnly, TmpMatrix, TmpVector1);
        Vector3.TransformNormalToRef(Vector3.Up(), TmpMatrix, TmpVector2);

        this._setWebAudioOrientation(TmpVector1, TmpVector2);
    }

    protected abstract _setWebAudioPosition(position: Vector3): void;
    protected abstract _setWebAudioOrientation(forward: Vector3, up: Vector3): void;
}

/**
 * Full-featured spatial audio listener for the Web Audio API.
 *
 * Used in browsers that support the `forwardX/Y/Z`, `positionX/Y/Z`, and `upX/Y/Z` properties on the AudioContext listener.
 *
 * NB: Firefox falls back to using this implementation.
 *
 * @see _SpatialWebAudioListenerFallback for the implementation used if only `setPosition` and `setOrientation` are available.
 *
 * NB: This sub property is not backed by a sub node and all properties are set directly on the audio context listener.
 *
 * @internal
 */
class _SpatialWebAudioListener extends _AbstractSpatialWebAudioListener {
    private _forwardX: _WebAudioParameterComponent;
    private _forwardY: _WebAudioParameterComponent;
    private _forwardZ: _WebAudioParameterComponent;
    private _positionX: _WebAudioParameterComponent;
    private _positionY: _WebAudioParameterComponent;
    private _positionZ: _WebAudioParameterComponent;
    private _upX: _WebAudioParameterComponent;
    private _upY: _WebAudioParameterComponent;
    private _upZ: _WebAudioParameterComponent;

    public constructor(engine: _WebAudioEngine, autoUpdate: boolean, minUpdateTime: number) {
        super(engine, autoUpdate, minUpdateTime);

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

    protected override _setWebAudioPosition(position: Vector3): void {
        // If attached and there is a ramp in progress, we assume another update is coming soon that we can wait for.
        // We don't do this for unattached nodes because there may not be another update coming.
        if (this.isAttached && (this._positionX.isRamping || this._positionY.isRamping || this._positionZ.isRamping)) {
            return;
        }

        this._positionX.targetValue = position.x;
        this._positionY.targetValue = position.y;
        this._positionZ.targetValue = position.z;
    }

    protected override _setWebAudioOrientation(forward: Vector3, up: Vector3): void {
        // If attached and there is a ramp in progress, we assume another update is coming soon that we can wait for.
        // We don't do this for unattached nodes because there may not be another update coming.
        if (
            this.isAttached &&
            (this._forwardX.isRamping || this._forwardY.isRamping || this._forwardZ.isRamping || this._upX.isRamping || this._upY.isRamping || this._upZ.isRamping)
        ) {
            return;
        }

        this._forwardX.targetValue = forward.x;
        this._forwardY.targetValue = forward.y;
        this._forwardZ.targetValue = forward.z;

        this._upX.targetValue = up.x;
        this._upY.targetValue = up.y;
        this._upZ.targetValue = up.z;
    }
}

/**
 * Fallback spatial audio listener for the Web Audio API.
 *
 * Used in browsers that do not support the `forwardX/Y/Z`, `positionX/Y/Z`, and `upX/Y/Z` properties on the
 * AudioContext listener.
 *
 * @see _SpatialWebAudioListener for the implementation used if the `forwardX/Y/Z`, `positionX/Y/Z`, and `upX/Y/Z`
 * properties are available.
 *
 * NB: This sub property is not backed by a sub node and all properties are set directly on the audio context listener.
 *
 * @internal
 */
class _SpatialWebAudioListenerFallback extends _AbstractSpatialWebAudioListener {
    protected override _setWebAudioPosition(position: Vector3): void {
        this._listener.setPosition(position.x, position.y, position.z);
    }

    protected override _setWebAudioOrientation(forward: Vector3, up: Vector3): void {
        this._listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
}
