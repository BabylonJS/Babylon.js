import { Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Nullable } from "../../../types";
import type { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import type { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";
import { _SpatialAudioTransformNodeAttacher } from "./spatialAudioTransformNodeAttacher";

/**
 * NB: This function is async so it can use a dynamic import in the future if needed.
 * @internal
 * */
export async function _CreateSpatialAudioMeshAttacherAsync(attacherComponent: _SpatialAudioAttacherComponent): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioMeshAttacher(attacherComponent);
}

/** @internal */
class _SpatialAudioMeshAttacher extends _SpatialAudioTransformNodeAttacher {
    protected override _transformNode: Nullable<AbstractMesh>;

    /** @internal */
    public constructor(attacherComponent: _SpatialAudioAttacherComponent) {
        super(attacherComponent);
    }

    protected override get _attachedPosition(): Vector3 {
        return this._transformNode?.getBoundingInfo().boundingSphere.centerWorld ?? Vector3.ZeroReadOnly;
    }

    /** @internal */
    public override getClassName(): string {
        return "_SpatialAudioMeshAttacher";
    }
}
