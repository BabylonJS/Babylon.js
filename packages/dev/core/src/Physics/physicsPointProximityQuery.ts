import type { Vector3 } from "../Maths/math.vector";
import type { IRaycastQuery } from "./physicsRaycastResult";
import type { PhysicsBody } from "./v2";

/**
 * Interface for point proximity query.
 */
export interface IPhysicsPointProximityQuery {
    /**
     * The position of the query
     */
    position: Vector3;
    /**
     * Maximum distance to check for collisions. Can be set to 0 to check for overlaps.
     */
    maxDistance: number;
    /**
     * Collision filter for the query.
     */
    collisionFilter: IRaycastQuery;
    /**
     * Should trigger collisions be considered in the query?
     */
    shouldHitTriggers: boolean;
    /**
     * Should the query ignore the body that is passed in?
     */
    ignoreBody?: PhysicsBody;
}
