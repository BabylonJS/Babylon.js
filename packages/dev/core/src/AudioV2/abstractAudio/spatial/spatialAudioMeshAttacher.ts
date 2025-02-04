import { Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Nullable } from "../../../types";
import type { _AbstractSpatialAudioAttacher, ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _SpatialAudioTransformNodeAttacher } from "./spatialAudioTransformNodeAttacher";

/** @internal */
export async function _CreateSpatialAudioMeshAttacherAsync(mesh: AbstractMesh, spatialAudioNode: ISpatialAudioNode): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioMeshAttacher(mesh, spatialAudioNode);
}

/** @internal */
class _SpatialAudioMeshAttacher extends _SpatialAudioTransformNodeAttacher {
    protected override _transformNode: Nullable<AbstractMesh> = null;

    /** @internal */
    public constructor(mesh: AbstractMesh, spatialAudioNode: ISpatialAudioNode) {
        super(mesh, spatialAudioNode);
    }

    protected override get _attachedPosition(): Vector3 {
        return this._transformNode?.getBoundingInfo().boundingSphere.centerWorld ?? Vector3.ZeroReadOnly;
    }

    /** @internal */
    public override getClassName(): string {
        return "_SpatialAudioMeshAttacher";
    }
}
