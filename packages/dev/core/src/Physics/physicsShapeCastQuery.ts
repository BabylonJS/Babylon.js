import type { Quaternion, Vector3 } from "../Maths/math.vector";
import type { PhysicsShape } from "./v2/physicsShape";
import type { PhysicsBody } from "./v2/physicsBody";

/**
 * Shape cast query
 */
export interface IPhysicsShapeCastQuery {
    /**
     * The shape to query with
     */
    shape: PhysicsShape;
    /**
     * The rotation of the shape
     */
    rotation: Quaternion;
    /**
     * The start position of the query
     */
    startPosition: Vector3;
    /**
     * The end position of the query
     */
    endPosition: Vector3;
    /**
     * Should trigger collisions be considered in the query?
     */
    shouldHitTriggers: boolean;
    /**
     * Ignores the body passed if it is in the query
     */
    ignoreBody?: PhysicsBody;
}
