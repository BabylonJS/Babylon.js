import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import { PrecisionDate } from "../../../Misc/precisionDate";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";
import { SpatialAudioAttachmentType } from "./spatialAudioAttacher";

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
    private _minUpdateTime: number = 0;
    private _scene: Nullable<Scene> = null;

    protected abstract _attachedPosition: Vector3;
    protected abstract _attachedRotationQuaternion: Quaternion;

    protected _isDirty = true;

    /** @internal */
    public attachmentType: SpatialAudioAttachmentType;

    /** @internal */
    public spatialAudioNode: ISpatialAudioNode;

    protected constructor(spatialAudioNode: ISpatialAudioNode, attachmentType: SpatialAudioAttachmentType, minUpdateTime: number) {
        this.spatialAudioNode = spatialAudioNode;
        this.attachmentType = attachmentType;
        this.minUpdateTime = minUpdateTime;
    }

    /** @internal */
    public get minUpdateTime(): number {
        return this._minUpdateTime;
    }

    public set minUpdateTime(value: number) {
        if (this._minUpdateTime === value) {
            return;
        }

        this._minUpdateTime = value;

        this._updateObservers();
    }

    /** @internal */
    public dispose(): void {
        this._detachScene();
        this._scene = null;
    }

    /** @internal */
    public abstract getClassName(): string;

    protected _setScene(scene: Nullable<Scene>) {
        this._detachScene();

        this._scene = scene;

        this._updateObservers();
    }

    protected _update(): void {
        if (!this.spatialAudioNode) {
            return;
        }

        if (0 < this._minUpdateTime) {
            if (!this._isDirty) {
                return;
            }

            const now = PrecisionDate.Now;
            if (this._lastUpdateTime && now - this._lastUpdateTime < this.spatialAudioNode.minUpdateTime) {
                return;
            }
            this._lastUpdateTime = now;
        }

        if (this.attachmentType & SpatialAudioAttachmentType.POSITION) {
            this.spatialAudioNode.position = this._attachedPosition;
        }

        if (this.attachmentType & SpatialAudioAttachmentType.ROTATION) {
            this.spatialAudioNode.rotationQuaternion = this._attachedRotationQuaternion;
        }
    }

    protected _updateObservers(): void {
        if (!this._scene) {
            return;
        }

        if (0 < this._minUpdateTime) {
            this._scene.onAfterRenderObservable.add(this._onAfterRender);
        }
    }

    private _detachScene(): void {
        if (!this._scene) {
            return;
        }

        this._scene.onAfterRenderObservable.removeCallback(this._onAfterRender);
    }

    private _onAfterRender = (): void => {
        this._update();
    };
}
