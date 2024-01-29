import { Vector3 } from "../Maths/math.vector";
import type { PhysicsShape } from "./v2";
import type { PhysicsBody } from "./v2/physicsBody";

/**
 * Base class for results of casts.
 */
export class CastingResult {
    private _hasHit: boolean = false;
    protected _hitNormal: Vector3 = Vector3.Zero();
    protected _hitPoint: Vector3 = Vector3.Zero();
    private _triangleIndex: number = -1;

    /**
     * The Physics body that the query hit.
     */
    public body?: PhysicsBody;
    /**
     * The body Index in case the Physics body is using instances
     */
    public bodyIndex?: number;

    /**
     * The shape hit by the query.
     */
    public shape?: PhysicsShape;

    /**
     * Gets the hit point.
     */
    get hitPoint(): Vector3 {
        return this._hitPoint;
    }
    /**
     * Gets the hit normal.
     */
    get hitNormal(): Vector3 {
        return this._hitNormal;
    }
    /**
     * Gets if there was a hit
     */
    get hasHit(): boolean {
        return this._hasHit;
    }

    /*
     * The index of the original triangle which was hit. Will be -1 if contact point is not on a mesh shape
     */
    get triangleIndex(): number {
        return this._triangleIndex;
    }

    /**
     * Sets the hit data
     * @param hitNormal defines the normal in world space
     * @param hitPoint defines the point in world space
     * @param triangleIndex defines the index of the triangle in case of mesh shape
     */
    public setHitData(hitNormal: IXYZ, hitPoint: IXYZ, triangleIndex?: number) {
        this._hasHit = true;
        this._hitNormal.set(hitNormal.x, hitNormal.y, hitNormal.z);
        this._hitPoint.set(hitPoint.x, hitPoint.y, hitPoint.z);
        this._triangleIndex = triangleIndex ?? -1;
    }

    /**
     * Resets all the values to default
     */
    public reset() {
        this._hasHit = false;

        this._hitNormal.setAll(0);
        this._hitPoint.setAll(0);
        this._triangleIndex = -1;

        this.body = undefined;
        this.bodyIndex = undefined;

        this.shape = undefined;
    }
}

/**
 * Interface for the size containing width and height
 */
interface IXYZ {
    /**
     * X
     */
    x: number;

    /**
     * Y
     */
    y: number;

    /**
     * Z
     */
    z: number;
}
