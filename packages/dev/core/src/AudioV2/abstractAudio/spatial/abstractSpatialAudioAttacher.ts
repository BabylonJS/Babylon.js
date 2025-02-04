import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import { PrecisionDate } from "../../../Misc/precisionDate";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";

/** @internal */
export interface ISpatialAudioNode {
    /** @internal */
    minUpdateTime: number;
    /** @internal */
    position: Vector3;
    /** @internal */
    rotationQuaternion: Quaternion;
}

/** @internal */
export abstract class _AbstractSpatialAudioAttacher {
    private _lastUpdateTime: number = 0;
    private _scene: Nullable<Scene> = null;

    protected abstract _attachedPosition: Vector3;
    protected abstract _attachedRotationQuaternion: Quaternion;

    /** @internal */
    public spatialAudioNode: ISpatialAudioNode;

    /** @internal */
    public dispose(): void {
        this._detachScene();
        this._scene = null;
    }

    /** @internal */
    public abstract getClassName(): string;

    protected _setScene(scene: Nullable<Scene>) {
        if (this._scene === scene) {
            return;
        }

        this._detachScene();
        this._scene = scene;
        this._attachScene();
    }

    private _attachScene(): void {
        this._update();

        if (this._scene) {
            this._scene.onAfterRenderObservable.add(this._update);
        }
    }

    private _detachScene(): void {
        if (this._scene) {
            this._scene.onAfterRenderObservable.removeCallback(this._update);
        }
    }

    private _update = (): void => {
        if (!this.spatialAudioNode) {
            return;
        }

        const now = PrecisionDate.Now;
        if (this._lastUpdateTime && now - this._lastUpdateTime < this.spatialAudioNode.minUpdateTime) {
            return;
        }
        this._lastUpdateTime = now;

        this.spatialAudioNode.position = this._attachedPosition;
        this.spatialAudioNode.rotationQuaternion = this._attachedRotationQuaternion;
    };
}
