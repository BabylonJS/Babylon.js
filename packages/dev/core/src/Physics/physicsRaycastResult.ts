import { Vector3 } from "../Maths/math.vector";
import { PhysicsCastResult } from "./physicsCastResult";

/**
 * Interface for query parameters in the raycast function.
 * @see the "Collision Filtering" section in https://github.com/eoineoineoin/glTF/tree/MSFT_RigidBodies/extensions/2.0/Vendor/MSFT_collision_primitives
 */
export interface IRaycastQuery {
    /** Membership mask */
    membership?: number;
    /** CollideWith mask */
    collideWith?: number;
}

/**
 * Holds the data for the raycast result
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsRaycastResult extends PhysicsCastResult {
    private _rayFromWorld: Vector3 = Vector3.Zero();
    private _rayToWorld: Vector3 = Vector3.Zero();

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
        super.reset();

        this._rayFromWorld.copyFrom(from);
        this._rayToWorld.copyFrom(to);
    }
}
