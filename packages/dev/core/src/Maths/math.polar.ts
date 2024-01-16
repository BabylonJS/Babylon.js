/* eslint-disable @typescript-eslint/naming-convention */
import type { DeepImmutable } from "../types";
import { Vector2, Vector3 } from "./math.vector";

/**
 * Class used to store (r, theta) vector representation
 */
export class Polar {
    /**
     * Creates a new Polar object
     * @param radius the radius of the vector
     * @param theta the angle of the vector
     */
    constructor(
        public radius: number,
        public theta: number
    ) {
        this.radius = radius;
        this.theta = theta;
    }

    /**
     * Gets the class name
     * @returns the string "Polar"
     */
    public getClassName() {
        return "Polar";
    }

    /**
     * Converts the current polar to a string
     * @returns the current polar as a string
     */
    public toString() {
        return JSON.stringify(this);
    }

    /**
     * Converts the current polar to an array
     * @returns the current polar as an array
     */
    public asArray() {
        return [this.radius, this.theta];
    }

    /**
     * Adds the current Polar and the given Polar and stores the result
     * @param polar the polar to add
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    public addToRef(polar: Polar, ref: Polar) {
        ref.radius = this.radius + polar.radius;
        ref.theta = this.theta + polar.theta;
        return ref;
    }

    /**
     * Adds the current Polar and the given Polar
     * @param polar the polar to add
     * @returns the sum polar
     */
    public add(polar: Polar) {
        const ref = new Polar(0, 0);
        this.addToRef(polar, ref);
        return ref;
    }

    /**
     * Adds the given polar to the current polar
     * @param polar the polar to add
     * @returns the current polar
     */
    public addInPlace(polar: Polar) {
        this.addToRef(polar, this);
        return this;
    }

    /**
     * Adds the provided values to the current polar
     * @param radius the amount to add to the radius
     * @param theta the amount to add to the theta
     * @returns the current polar
     */
    public addInPlaceFromFloats(radius: number, theta: number) {
        this.radius += radius;
        this.theta += theta;
        return this;
    }

    /**
     * Subtracts the given Polar from the current Polar and stores the result
     * @param polar the polar to subtract
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    public subtractToRef(polar: Polar, ref: Polar) {
        ref.radius = this.radius - polar.radius;
        ref.theta = this.theta - polar.theta;
        return ref;
    }

    /**
     * Subtracts the given Polar from the current Polar
     * @param polar the polar to subtract
     * @returns the difference polar
     */
    public subtract(polar: Polar) {
        const ref = new Polar(0, 0);
        this.subtractToRef(polar, ref);
        return ref;
    }

    /**
     * Subtracts the given Polar from the current Polar
     * @param polar the polar to subtract
     * @returns the current polar
     */
    public subtractInPlace(polar: Polar) {
        this.subtractToRef(polar, this);
        return this;
    }

    /**
     * Subtracts the given floats from the current polar
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    public subtractFromFloatsToRef(radius: number, theta: number, ref: Polar) {
        ref.radius = this.radius - radius;
        ref.theta = this.theta - theta;
        return ref;
    }

    /**
     * Subtracts the given floats from the current polar
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @returns the difference polar
     */
    public subtractFromFloats(radius: number, theta: number) {
        const ref = new Polar(0, 0);
        this.subtractFromFloatsToRef(radius, theta, ref);
        return ref;
    }

    /**
     * Multiplies the given Polar with the current Polar and stores the result
     * @param polar the polar to multiply
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    public multiplyToRef(polar: Polar, ref: Polar) {
        ref.radius = this.radius * polar.radius;
        ref.theta = this.theta * polar.theta;
        return ref;
    }

    /**
     * Multiplies the given Polar with the current Polar
     * @param polar the polar to multiply
     * @returns the product polar
     */
    public multiply(polar: Polar) {
        const ref = new Polar(0, 0);
        this.multiplyToRef(polar, ref);
        return ref;
    }

    /**
     * Multiplies the given Polar with the current Polar
     * @param polar the polar to multiply
     * @returns the current polar
     */
    public multiplyInPlace(polar: Polar) {
        this.multiplyToRef(polar, this);
        return this;
    }

    /**
     * Divides the current Polar by the given Polar and stores the result
     * @param polar the polar to divide
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    public divideToRef(polar: Polar, ref: Polar) {
        ref.radius = this.radius / polar.radius;
        ref.theta = this.theta / polar.theta;
        return ref;
    }

    /**
     * Divides the current Polar by the given Polar
     * @param polar the polar to divide
     * @returns the quotient polar
     */
    public divide(polar: Polar) {
        const ref = new Polar(0, 0);
        this.divideToRef(polar, ref);
        return ref;
    }

    /**
     * Divides the current Polar by the given Polar
     * @param polar the polar to divide
     * @returns the current polar
     */
    public divideInPlace(polar: Polar) {
        this.divideToRef(polar, this);
        return this;
    }

    /**
     * Clones the current polar
     * @returns a clone of the current polar
     */
    public clone() {
        return new Polar(this.radius, this.theta);
    }

    /**
     * Copies the source polar into the current polar
     * @param source the polar to copy from
     * @returns the current polar
     */
    public copyFrom(source: Polar) {
        this.radius = source.radius;
        this.theta = source.theta;
        return this;
    }

    /**
     * Copies the given values into the current polar
     * @param radius the radius to use
     * @param theta the theta to use
     * @returns the current polar
     */
    public copyFromFloats(radius: number, theta: number) {
        this.radius = radius;
        this.theta = theta;
        return this;
    }

    /**
     * Scales the current polar and stores the result
     * @param scale defines the multiplication factor
     * @param ref where to store the result
     * @returns the updated ref
     */
    public scaleToRef(scale: number, ref: Polar) {
        ref.radius = this.radius * scale;
        ref.theta = this.theta * scale;
        return ref;
    }

    /**
     * Scales the current polar and returns a new polar with the scaled coordinates
     * @param scale defines the multiplication factor
     * @returns the scaled polar
     */
    public scale(scale: number) {
        const ref = new Polar(0, 0);
        this.scaleToRef(scale, ref);
        return ref;
    }

    /**
     * Scales the current polar
     * @param scale defines the multiplication factor
     * @returns the current polar
     */
    public scaleInPlace(scale: number) {
        this.scaleToRef(scale, this);
        return this;
    }

    /**
     * Sets the values of the current polar
     * @param radius the new radius
     * @param theta the new theta
     * @returns the current polar
     */
    public set(radius: number, theta: number) {
        this.radius = radius;
        this.theta = theta;
        return this;
    }

    /**
     * Sets the values of the current polar
     * @param value the new values
     * @returns the current polar
     */
    public setAll(value: number) {
        this.set(value, value);
        return this;
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
        const ref = new Vector2(0, 0);
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

    /**
     * Converts an array of floats to a polar
     * @param array the array to convert
     * @returns the converted polar
     */
    public static FromArray(array: number[]) {
        return new Polar(array[0], array[1]);
    }
}

/**
 * Class used for (radius, theta, phi) vector representation.
 */
export class Spherical {
    /**
     * Creates a new Spherical object from the given spherical coordinates
     * @param radius spherical radius
     * @param theta angle from positive y axis to radial line from 0 to PI (vertical)
     * @param phi angle from positive x axis measured anticlockwise from -PI to PI (horizontal)
     */
    constructor(
        public radius: number,
        public theta: number,
        public phi: number
    ) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
    }

    /**
     * Gets the class name
     * @returns the string "Spherical"
     */
    public getClassName() {
        return "Spherical";
    }

    /**
     * Converts the current spherical to a string
     * @returns the current spherical as a string
     */
    public toString() {
        return JSON.stringify(this);
    }

    /**
     * Converts the current spherical to an array
     * @returns the current spherical as an array
     */
    public asArray() {
        return [this.radius, this.theta, this.phi];
    }

    /**
     * Adds the current Spherical and the given Spherical and stores the result
     * @param spherical the spherical to add
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    public addToRef(spherical: Spherical, ref: Spherical) {
        ref.radius = this.radius + spherical.radius;
        ref.theta = this.theta + spherical.theta;
        ref.phi = this.phi + spherical.phi;
        return ref;
    }

    /**
     * Adds the current Spherical and the given Spherical
     * @param spherical the spherical to add
     * @returns the sum spherical
     */
    public add(spherical: Spherical) {
        const ref = new Spherical(0, 0, 0);
        this.addToRef(spherical, ref);
        return ref;
    }

    /**
     * Adds the given spherical to the current spherical
     * @param spherical the spherical to add
     * @returns the current spherical
     */
    public addInPlace(spherical: Spherical) {
        this.addToRef(spherical, this);
        return this;
    }

    /**
     * Adds the provided values to the current spherical
     * @param radius the amount to add to the radius
     * @param theta the amount to add to the theta
     * @param phi the amount to add to the phi
     * @returns the current spherical
     */
    public addInPlaceFromFloats(radius: number, theta: number, phi: number) {
        this.radius += radius;
        this.theta += theta;
        this.phi += phi;
        return this;
    }

    /**
     * Subtracts the given Spherical from the current Spherical and stores the result
     * @param spherical the spherical to subtract
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    public subtractToRef(spherical: Spherical, ref: Spherical) {
        ref.radius = this.radius - spherical.radius;
        ref.theta = this.theta - spherical.theta;
        ref.phi = this.phi - spherical.phi;
        return ref;
    }

    /**
     * Subtracts the given Spherical from the current Spherical
     * @param spherical the spherical to subtract
     * @returns the difference spherical
     */
    public subtract(spherical: Spherical) {
        const ref = new Spherical(0, 0, 0);
        this.subtractToRef(spherical, ref);
        return ref;
    }

    /**
     * Subtracts the given Spherical from the current Spherical
     * @param spherical the spherical to subtract
     * @returns the current spherical
     */
    public subtractInPlace(spherical: Spherical) {
        this.subtractToRef(spherical, this);
        return this;
    }

    /**
     * Subtracts the given floats from the current spherical
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @param phi the amount to subtract from the phi
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    public subtractFromFloatsToRef(radius: number, theta: number, phi: number, ref: Spherical) {
        ref.radius = this.radius - radius;
        ref.theta = this.theta - theta;
        ref.phi = this.phi - phi;
        return ref;
    }

    /**
     * Subtracts the given floats from the current spherical
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @param phi the amount to subtract from the phi
     * @returns the difference spherical
     */
    public subtractFromFloats(radius: number, theta: number, phi: number) {
        const ref = new Spherical(0, 0, 0);
        this.subtractFromFloatsToRef(radius, theta, phi, ref);
        return ref;
    }

    /**
     * Multiplies the given Spherical with the current Spherical and stores the result
     * @param spherical the spherical to multiply
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    public multiplyToRef(spherical: Spherical, ref: Spherical) {
        ref.radius = this.radius * spherical.radius;
        ref.theta = this.theta * spherical.theta;
        ref.phi = this.phi * spherical.phi;
        return ref;
    }

    /**
     * Multiplies the given Spherical with the current Spherical
     * @param spherical the spherical to multiply
     * @returns the product spherical
     */
    public multiply(spherical: Spherical) {
        const ref = new Spherical(0, 0, 0);
        this.multiplyToRef(spherical, ref);
        return ref;
    }

    /**
     * Multiplies the given Spherical with the current Spherical
     * @param spherical the spherical to multiply
     * @returns the current spherical
     */
    public multiplyInPlace(spherical: Spherical) {
        this.multiplyToRef(spherical, this);
        return this;
    }

    /**
     * Divides the current Spherical by the given Spherical and stores the result
     * @param spherical the spherical to divide
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    public divideToRef(spherical: Spherical, ref: Spherical) {
        ref.radius = this.radius / spherical.radius;
        ref.theta = this.theta / spherical.theta;
        ref.phi = this.phi / spherical.phi;
        return ref;
    }

    /**
     * Divides the current Spherical by the given Spherical
     * @param spherical the spherical to divide
     * @returns the quotient spherical
     */
    public divide(spherical: Spherical) {
        const ref = new Spherical(0, 0, 0);
        this.divideToRef(spherical, ref);
        return ref;
    }

    /**
     * Divides the current Spherical by the given Spherical
     * @param spherical the spherical to divide
     * @returns the current spherical
     */
    public divideInPlace(spherical: Spherical) {
        this.divideToRef(spherical, this);
        return this;
    }

    /**
     * Clones the current spherical
     * @returns a clone of the current spherical
     */
    public clone() {
        return new Spherical(this.radius, this.theta, this.phi);
    }

    /**
     * Copies the source spherical into the current spherical
     * @param source the spherical to copy from
     * @returns the current spherical
     */
    public copyFrom(source: Spherical) {
        this.radius = source.radius;
        this.theta = source.theta;
        this.phi = source.phi;
        return this;
    }

    /**
     * Copies the given values into the current spherical
     * @param radius the radius to use
     * @param theta the theta to use
     * @param phi the phi to use
     * @returns the current spherical
     */
    public copyFromFloats(radius: number, theta: number, phi: number) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
        return this;
    }

    /**
     * Scales the current spherical and stores the result
     * @param scale defines the multiplication factor
     * @param ref where to store the result
     * @returns the updated ref
     */
    public scaleToRef(scale: number, ref: Spherical) {
        ref.radius = this.radius * scale;
        ref.theta = this.theta * scale;
        ref.phi = this.phi * scale;
        return ref;
    }

    /**
     * Scales the current spherical and returns a new spherical with the scaled coordinates
     * @param scale defines the multiplication factor
     * @returns the scaled spherical
     */
    public scale(scale: number) {
        const ref = new Spherical(0, 0, 0);
        this.scaleToRef(scale, ref);
        return ref;
    }

    /**
     * Scales the current spherical
     * @param scale defines the multiplication factor
     * @returns the current spherical
     */
    public scaleInPlace(scale: number) {
        this.scaleToRef(scale, this);
        return this;
    }

    /**
     * Sets the values of the current spherical
     * @param radius the new radius
     * @param theta the new theta
     * @param phi the new phi
     * @returns the current spherical
     */
    public set(radius: number, theta: number, phi: number) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
        return this;
    }

    /**
     * Sets the values of the current spherical
     * @param value the new values
     * @returns the current spherical
     */
    public setAll(value: number) {
        this.set(value, value, value);
        return this;
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
     * @returns the (x, y,z) form of the current Spherical
     */
    public toVector3(): Vector3 {
        const ref = new Vector3(0, 0, 0);
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

    /**
     * Converts an array of floats to a spherical
     * @param array the array to convert
     * @returns the converted spherical
     */
    public static FromArray(array: number[]) {
        return new Spherical(array[0], array[1], array[2]);
    }
}
