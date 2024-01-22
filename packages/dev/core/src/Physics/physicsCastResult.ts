import { Vector3 } from "../Maths/math.vector";
import type { PhysicsShape } from "./v2";
import type { PhysicsBody } from "./v2/physicsBody";
/**
 * Base class holding the data for the result of a cast (raycast, shapecast, point proximity, etc...)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsCastResult {
    private _hasHit: boolean = false;

    protected _hitDistance: number = 0;
    private _hitNormalWorld: Vector3 = Vector3.Zero();
    protected _hitPointWorld: Vector3 = Vector3.Zero();
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
    get hitNormalWorld(): Vector3 {
        return this._hitNormalWorld;
    }

    /**
     * Gets the hit point in the world
     */
    get hitPointWorld(): Vector3 {
        return this._hitPointWorld;
    }

    /*
     * The index of the original triangle which was hit. Will be -1 if contact point is not on a mesh shape
     */
    get triangleIndex(): number {
        return this._triangleIndex;
    }

    /**
     * Sets the hit data (normal & point in world space)
     * @param hitNormalWorld defines the normal in world space
     * @param hitPointWorld defines the point in world space
     */
    public setHitData(hitNormalWorld: IXYZ, hitPointWorld: IXYZ, triangleIndex?: number) {
        this._hasHit = true;
        this._hitNormalWorld.set(hitNormalWorld.x, hitNormalWorld.y, hitNormalWorld.z);
        this._hitPointWorld.set(hitPointWorld.x, hitPointWorld.y, hitPointWorld.z);
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

        this._hitNormalWorld.setAll(0);
        this._hitPointWorld.setAll(0);
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
