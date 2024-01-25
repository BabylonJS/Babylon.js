import type { Quaternion, Vector3 } from "../Maths/math.vector";
import type { PhysicsShape } from "./v2/physicsShape";
import type { PhysicsBody } from "./v2/physicsBody";

/**
 * Query for shape proximity.
 */
export interface IPhysicsShapeProximityCastQuery {
    /**
     * The shape to test proximity against
     */
    shape: PhysicsShape;
    /**
     * The position of shape
     */
    position: Vector3;
    /**
     * The rotation of shape
     */
    rotation: Quaternion;
    /**
     * Maximum distance to check for collisions. Can be set to 0 to check for overlaps.
     */
    maxDistance: number;
    /**
     * Should trigger collisions be considered in the query?
     */
    shouldHitTriggers: boolean;
    /**
     * Ignores the body passed if it is in the query
     */
    ignoreBody?: PhysicsBody;
}
