import { Vector3 } from './math.vector';

/** Defines supported spaces */
export enum Space {
    /** Local (object) space */
    LOCAL = 0,
    /** World space */
    WORLD = 1,
    /** Bone space */
    BONE = 2
}

/** Defines the 3 main axes */
export class Axis {
    /** X axis */
    public static X: Vector3 = new Vector3(1.0, 0.0, 0.0);
    /** Y axis */
    public static Y: Vector3 = new Vector3(0.0, 1.0, 0.0);
    /** Z axis */
    public static Z: Vector3 = new Vector3(0.0, 0.0, 1.0);
}

/**
 * Defines cartesian components.
 */
export enum Coordinate {
    /** X axis */
    X,
    /** Y axis */
    Y,
    /** Z axis */
    Z
}
