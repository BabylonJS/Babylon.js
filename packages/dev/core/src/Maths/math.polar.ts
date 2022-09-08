/* eslint-disable @typescript-eslint/naming-convention */
import type { DeepImmutable, Nullable, float } from "../types";
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
	constructor(radius: number, theta: number){
		this.radius = radius;
		this.theta = theta;
	}

	/**
	 * Gets the rectangular coordinates of the current Polar
	 * @param ref the reference to assign the result
	 * @returns the updated reference
	 */
	 public toVector2ToRef(ref: Vector2): Vector2{
		let x = this.radius * Math.cos(this.theta);
		let y = this.radius * Math.sin(this.theta);
		ref.set(x, y);
		return ref;
	}

	/**
	 * Gets the rectangular coordinates of the current Polar
	 * @returns the rectangular coordinates
	 */
	public toVector2(): Vector2{
		let ref = TmpVectors.Vector2[0];
		return this.toVector2ToRef(ref);
	}

	/**
	 * Converts a given Vector2 to its polar coordinates
	 * @param v the Vector2 to convert
	 * @param ref the reference to assign the result
	 * @returns the updated reference
	 */
	public static FromVector2ToRef(v: Vector2, ref: Polar): Polar{
		const theta  = Math.sign(v.y) * Math.acos(v.x / v.length());
		ref.radius = v.length();
		ref.theta = theta;
		return ref
	}

	/**
	 * Converts a given Vector2 to its polar coordinates
	 * @param v the Vector2 to convert
	 * @returns a Polar
	 */
	public static FromVector2(v: Vector2): Polar{
		let polar = new Polar();
		Polar.FromVector2ToRef(v, polar);
		return polar;
	}
}

export class Spherical {
	public radius: number;
	public theta: number;
	public phi: number;

	constructor(radius, theta, phi){
		this.radius = radius;
		this.theta = theta;
		this.phi = phi;
	}

	/**
	 * Assigns the rectangular coordinates of the current Spherical to a Vector3
	 * @param ref the Vector3 to update
	 * @returns the updated Vector3
	 */
	public toVector3ToRef(ref: DeepImmutable<Vector3>): Vector3{
		let x = this.radius * Math.sin(this.theta) * Math.cos(this.phi);
		let y = this.radius  * Math.sin(this.theta) * Math.sin(this.phi);
		let z = this.radius * Math.cos(this.theta);
		ref.set(x, y, z);
		return ref;
	}

	/**
	 * Gets a Vector3 from the current spherical coordinates
	 * @returns the Vector3
	 */
	public toVector3(): Vector3{
		let ref = TmpVectors.Vector3[0];
		return this.toVector3ToRef(ref);
	}

	/**
	 * Assigns the spherical coordinates from a Vector3
	 * @param vector the vector to convert
	 * @param ref the Spherical to update
	 * @returns the updated ref
	 */
	public static FromVector3ToRef(vector: DeepImmutable<Vector3>, ref: Spherical): Spherical{
		ref.radius = vector.length();
		ref.theta = Math.atan(diff.z / diff.x);
		ref.phi = Math.asin(diff.y / ref.radius);
		return ref;
	}

	/**
	 * Gets a Spherical from a Vector3
	 * @param vector defines the vector in (x, y, z) coordinate space
	 * @returns a new Spherical 
	 */
	public static FromVector3(vector: DeepImmutable<Vector3>): Spherical{
		let spherical = new Spherical();
		Spherical.FromVector3ToRef(vector, spherical);
		return spherical;
	}
}