/* eslint-disable @typescript-eslint/naming-convention */
import type { DeepImmutable } from "../types";
import type { Vector2, Vector3 } from "./math.vector";
import { TmpVectors } from "./math.vector";

/**
 * Class used to store (r, theta) vector representation
 */
export class Polar {
    public radius: number;
    public theta: number;

    /**
     * Creates a new Polar object
     * @param radius the radius of the vector
     * @param theta the angle of the vector
     */
    constructor(radius: number, theta: number) {
        this.radius = radius;
        this.theta = theta;
    }

    /**
     * Gets the rectangular coordinates of the current Polar
     * @param ref the reference to assign the result
     * @returns the updated reference
     */
    public toVector2ToRef(ref: Vector2): Vector2 {
        const x = this.radius * Math.cos(this.theta);
        const y = this.radius * Math.sin(this.theta);
        ref.set(x, y);
        return ref;
    }

    /**
     * Gets the rectangular coordinates of the current Polar
     * @returns the rectangular coordinates
     */
    public toVector2(): Vector2 {
        const ref = TmpVectors.Vector2[0];
        return this.toVector2ToRef(ref);
    }

    /**
     * Converts a given Vector2 to its polar coordinates
     * @param v the Vector2 to convert
     * @param ref the reference to assign the result
     * @returns the updated reference
     */
    public static FromVector2ToRef(v: Vector2, ref: Polar): Polar {
        const theta = Math.sign(v.y) * Math.acos(v.x / v.length());
        ref.radius = v.length();
        ref.theta = theta;
        return ref;
    }

    /**
     * Converts a given Vector2 to its polar coordinates
     * @param v the Vector2 to convert
     * @returns a Polar
     */
    public static FromVector2(v: Vector2): Polar {
        const polar = new Polar(0, 0);
        Polar.FromVector2ToRef(v, polar);
        return polar;
    }
}

/**
 * Class used for (radius, theta, phi) vector representation.
 */
export class Spherical {
    public radius: number;
    public theta: number;
    public phi: number;

    /**
     * @param radius spherical radius
     * @param theta angle from positive y axis to radial line from 0 to PI (vertical)
     * @param phi angle from positive x axis measured anticlockwise from -PI to PI (horizontal)
     */
    constructor(radius: number, theta: number, phi: number) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
    }

    /**
     * Assigns the rectangular coordinates of the current Spherical to a Vector3
     * @param ref the Vector3 to update
     * @returns the updated Vector3
     */
    public toVector3ToRef(ref: DeepImmutable<Vector3>): Vector3 {
        const x = this.radius * Math.sin(this.theta) * Math.cos(this.phi);
        const y = this.radius * Math.cos(this.theta);
        const z = this.radius * Math.sin(this.theta) * Math.sin(this.phi);
        ref.set(x, y, z);
        return ref;
    }

    /**
     * Gets a Vector3 from the current spherical coordinates
     * @returns the Vector3
     */
    public toVector3(): Vector3 {
        const ref = TmpVectors.Vector3[0];
        return this.toVector3ToRef(ref);
    }

    /**
     * Assigns the spherical coordinates from a Vector3
     * @param vector the vector to convert
     * @param ref the Spherical to update
     * @returns the updated ref
     */
    public static FromVector3ToRef(vector: DeepImmutable<Vector3>, ref: Spherical): Spherical {
        ref.radius = vector.length();
        ref.theta = Math.acos(vector.y / ref.radius);
        ref.phi = Math.atan2(vector.z, vector.x);
        return ref;
    }

    /**
     * Gets a Spherical from a Vector3
     * @param vector defines the vector in (x, y, z) coordinate space
     * @returns a new Spherical
     */
    public static FromVector3(vector: DeepImmutable<Vector3>): Spherical {
        const spherical = new Spherical(0, 0, 0);
        Spherical.FromVector3ToRef(vector, spherical);
        return spherical;
    }
}
