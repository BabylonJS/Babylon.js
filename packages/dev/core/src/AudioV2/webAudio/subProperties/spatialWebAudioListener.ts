import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioListener } from "../../abstractAudio/subProperties/spatialAudioListener";
import { _SpatialWebAudioUpdaterComponent } from "../components/spatialWebAudioUpdaterComponent";
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
    protected override _setWebAudioPosition(position: Vector3): void {
        this.engine._setAudioParam(this._listener.positionX, position.x);
        this.engine._setAudioParam(this._listener.positionY, position.y);
        this.engine._setAudioParam(this._listener.positionZ, position.z);
    }

    protected override _setWebAudioOrientation(forward: Vector3, up: Vector3): void {
        this.engine._setAudioParam(this._listener.forwardX, forward.x);
        this.engine._setAudioParam(this._listener.forwardY, forward.y);
        this.engine._setAudioParam(this._listener.forwardZ, forward.z);

        this.engine._setAudioParam(this._listener.upX, up.x);
        this.engine._setAudioParam(this._listener.upY, up.y);
        this.engine._setAudioParam(this._listener.upZ, up.z);
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
        this._listener.setPosition(this.position.x, this.position.y, this.position.z);
    }

    protected override _setWebAudioOrientation(forward: Vector3, up: Vector3): void {
        this._listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
}
