import { Vector3 } from "../Maths/math.vector";
import type { PhysicsShape } from "./v2";
import type { PhysicsBody } from "./v2/physicsBody";

/**
 * Class representing a contact point produced in a cast
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class ContactPoint {
    private _hasHit: boolean = false;

    protected _hitDistance: number = 0;
    private _hitNormal: Vector3 = Vector3.Zero();
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
     * Gets if there was a hit
     */
    get hasHit(): boolean {
        return this._hasHit;
    }

    /**
     * Gets the distance from the hit
     */
    get hitDistance(): number {
        return this._hitDistance;
    }

    /**
     * Gets the hit normal/direction in the world
     */
    get hitNormal(): Vector3 {
        return this._hitNormal;
    }

    /**
     * Gets the hit point in the world
     */
    get hitPoint(): Vector3 {
        return this._hitPoint;
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
     * Sets the distance from the start point to the hit point
     * @param distance
     */
    public setHitDistance(distance: number) {
        this._hitDistance = distance;
    }

    /**
     * Resets all the values to default
     */
    public reset() {
        this._hasHit = false;
        this._hitDistance = 0;

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
