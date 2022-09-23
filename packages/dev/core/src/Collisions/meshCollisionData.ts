import type { Collider } from "./collider";
import { Vector3 } from "../Maths/math.vector";
import type { Nullable } from "../types";
import type { Observer } from "../Misc/observable";

declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _MeshCollisionData {
    public _checkCollisions = false;
    public _collisionMask = -1;
    public _collisionGroup = -1;
    public _surroundingMeshes: Nullable<AbstractMesh[]> = null;
    public _collider: Nullable<Collider> = null;
    public _oldPositionForCollisions = new Vector3(0, 0, 0);
    public _diffPositionForCollisions = new Vector3(0, 0, 0);
    public _onCollideObserver: Nullable<Observer<AbstractMesh>>;
    public _onCollisionPositionChangeObserver: Nullable<Observer<Vector3>>;
    public _collisionResponse = true;
}
