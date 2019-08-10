import { Vector3 } from "../Maths/math.vector";

/**
 * Holds the data for the raycast result
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class PhysicsRaycastResult {

    private _hasHit: boolean = false;

    private _hitDistance: number = 0;
    private _hitNormalWorld: Vector3 = Vector3.Zero();
    private _hitPointWorld: Vector3 = Vector3.Zero();
    private _rayFromWorld: Vector3 = Vector3.Zero();
    private _rayToWorld: Vector3 = Vector3.Zero();

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

    /**
     * Gets the ray "start point" of the ray in the world
     */
    get rayFromWorld(): Vector3 {
        return this._rayFromWorld;
    }

    /**
     * Gets the ray "end point" of the ray in the world
     */
    get rayToWorld(): Vector3 {
        return this._rayToWorld;
    }

    /**
     * Sets the hit data (normal & point in world space)
     * @param hitNormalWorld defines the normal in world space
     * @param hitPointWorld defines the point in world space
     */
    public setHitData(hitNormalWorld: IXYZ, hitPointWorld: IXYZ) {
        this._hasHit = true;
        this._hitNormalWorld = new Vector3(hitNormalWorld.x, hitNormalWorld.y, hitNormalWorld.z);
        this._hitPointWorld = new Vector3(hitPointWorld.x, hitPointWorld.y, hitPointWorld.z);
    }

    /**
     * Sets the distance from the start point to the hit point
     * @param distance
     */
    public setHitDistance(distance: number) {
        this._hitDistance = distance;
    }

    /**
     * Calculates the distance manually
     */
    public calculateHitDistance() {
        this._hitDistance = Vector3.Distance(this._rayFromWorld, this._hitPointWorld);
    }

    /**
     * Resets all the values to default
     * @param from The from point on world space
     * @param to The to point on world space
     */
    public reset(from: Vector3 = Vector3.Zero(), to: Vector3 = Vector3.Zero()) {
        this._rayFromWorld = from;
        this._rayToWorld = to;

        this._hasHit = false;
        this._hitDistance = 0;

        this._hitNormalWorld = Vector3.Zero();
        this._hitPointWorld = Vector3.Zero();
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
