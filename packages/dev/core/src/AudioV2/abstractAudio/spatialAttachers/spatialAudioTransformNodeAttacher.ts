import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";

const TempQuaternion = Quaternion.Identity();

/**
 * NB: This function is async so it can use a dynamic import in the future if needed.
 * @internal
 * */
export async function _CreateSpatialAudioTransformNodeAttacherAsync(attacherComponent: _SpatialAudioAttacherComponent): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioTransformNodeAttacher(attacherComponent);
}

/** @internal */
export class _SpatialAudioTransformNodeAttacher extends _AbstractSpatialAudioAttacher {
    protected _transformNode: Nullable<TransformNode> = null;

    /** @internal */
    public constructor(attacherComponent: _SpatialAudioAttacherComponent) {
        super(attacherComponent);

        this.transformNode = attacherComponent.attachedTransformNode;
    }

    /** @internal */
    public set transformNode(transformNode: Nullable<TransformNode>) {
        if (this._transformNode === this.transformNode) {
            return;
        }

        this._clearTransformNode();

        this._transformNode = transformNode;
        this._transformNode?.onDisposeObservable.add(this._onTransformNodeDisposed);

        this.update();
    }

    protected get _attachedPosition(): Vector3 {
        return this._transformNode?.absolutePosition ?? Vector3.ZeroReadOnly;
    }

    protected get _attachedRotationQuaternion(): Quaternion {
        if (!this._transformNode) {
            TempQuaternion.copyFromFloats(0, 0, 0, 1);
            return TempQuaternion;
        }

        this._transformNode.getWorldMatrix().decompose(undefined, TempQuaternion, undefined);
        return TempQuaternion;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();
        this._clearTransformNode();
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialAudioTransformNodeAttacher";
    }

    /** @internal */
    public override update(force: boolean = false): void {
        super.update();

        if (force) {
            this._transformNode?.computeWorldMatrix(true);
        }
    }

    private _clearTransformNode() {
        this._transformNode?.onDisposeObservable.removeCallback(this._onTransformNodeDisposed);
        this._transformNode = null;
    }

    private _onTransformNodeDisposed = () => {
        this.dispose();
    };
}
