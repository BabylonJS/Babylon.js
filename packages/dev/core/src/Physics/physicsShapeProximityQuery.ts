import type { Quaternion, Vector3 } from "../Maths/math.vector";
import type { PhysicsShape } from "./v2/physicsShape";
import type { PhysicsBody } from "./v2/physicsBody";

export interface IPhysicsShapeProximityQuery {
    shape: PhysicsShape;
    /**
     * The position of the query
     */
    position: Vector3;
    /**
     * The rotation of the query
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
     * Should the query ignore the body that is passed in?
     */
    ignoreBody?: PhysicsBody;
}
