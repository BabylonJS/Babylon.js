import { Scalar } from "./math.scalar";
import { Epsilon } from './math.constants';
import { Viewport } from './math.viewport';
import { DeepImmutable, Nullable, FloatArray, float } from "../types";
import { ArrayTools } from '../Misc/arrayTools';
import { IPlaneLike } from './math.like';
import { _TypeStore } from '../Misc/typeStore';
import { Plane } from './math.plane';
import { PerformanceConfigurator } from '../Engines/performanceConfigurator';

type TransformNode = import('../Meshes/transformNode').TransformNode;

/**
 * Class representing a vector containing 2 coordinates
 */
export class Vector2 {
    /**
     * Creates a new Vector2 from the given x and y coordinates
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     */
    constructor(
        /** defines the first coordinate */
        public x: number = 0,
        /** defines the second coordinate */
        public y: number = 0) {
    }

    /**
     * Gets a string with the Vector2 coordinates
     * @returns a string with the Vector2 coordinates
     */
    public toString(): string {
        return `{X: ${this.x} Y: ${this.y}}`;
    }

    /**
     * Gets class name
     * @returns the string "Vector2"
     */
    public getClassName(): string {
        return "Vector2";
    }

    /**
     * Gets current vector hash code
     * @returns the Vector2 hash code as a number
     */
    public getHashCode(): number {
        let hash = this.x | 0;
        hash = (hash * 397) ^ (this.y | 0);
        return hash;
    }

    // Operators

    /**
     * Sets the Vector2 coordinates in the given array or Float32Array from the given index.
     * @param array defines the source array
     * @param index defines the offset in source array
     * @returns the current Vector2
     */
    public toArray(array: FloatArray, index: number = 0): Vector2 {
        array[index] = this.x;
        array[index + 1] = this.y;
        return this;
    }

    /**
     * Update the current vector from an array
     * @param array defines the destination array
     * @param index defines the offset in the destination array
     * @returns the current Vector3
     */
    public fromArray(array: FloatArray, index: number = 0): Vector2 {
        Vector2.FromArrayToRef(array, index, this);
        return this;
    }

    /**
     * Copy the current vector to an array
     * @returns a new array with 2 elements: the Vector2 coordinates.
     */
    public asArray(): number[] {
        var result = new Array<number>();
        this.toArray(result, 0);
        return result;
    }

    /**
     * Sets the Vector2 coordinates with the given Vector2 coordinates
     * @param source defines the source Vector2
     * @returns the current updated Vector2
     */
    public copyFrom(source: DeepImmutable<Vector2>): Vector2 {
        this.x = source.x;
        this.y = source.y;
        return this;
    }

    /**
     * Sets the Vector2 coordinates with the given floats
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     * @returns the current updated Vector2
     */
    public copyFromFloats(x: number, y: number): Vector2 {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Sets the Vector2 coordinates with the given floats
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     * @returns the current updated Vector2
     */
    public set(x: number, y: number): Vector2 {
        return this.copyFromFloats(x, y);
    }
    /**
     * Add another vector with the current one
     * @param otherVector defines the other vector
     * @returns a new Vector2 set with the addition of the current Vector2 and the given one coordinates
     */
    public add(otherVector: DeepImmutable<Vector2>): Vector2 {
        return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the addition of the current Vector2 and the given one coordinates
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public addToRef(otherVector: DeepImmutable<Vector2>, result: Vector2): Vector2 {
        result.x = this.x + otherVector.x;
        result.y = this.y + otherVector.y;
        return this;
    }

    /**
     * Set the Vector2 coordinates by adding the given Vector2 coordinates
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public addInPlace(otherVector: DeepImmutable<Vector2>): Vector2 {
        this.x += otherVector.x;
        this.y += otherVector.y;
        return this;
    }

    /**
     * Gets a new Vector2 by adding the current Vector2 coordinates to the given Vector3 x, y coordinates
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public addVector3(otherVector: Vector3): Vector2 {
        return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
    }

    /**
     * Gets a new Vector2 set with the subtracted coordinates of the given one from the current Vector2
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public subtract(otherVector: Vector2): Vector2 {
        return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the subtraction of the given one from the current Vector2 coordinates.
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public subtractToRef(otherVector: DeepImmutable<Vector2>, result: Vector2): Vector2 {
        result.x = this.x - otherVector.x;
        result.y = this.y - otherVector.y;
        return this;
    }
    /**
     * Sets the current Vector2 coordinates by subtracting from it the given one coordinates
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public subtractInPlace(otherVector: DeepImmutable<Vector2>): Vector2 {
        this.x -= otherVector.x;
        this.y -= otherVector.y;
        return this;
    }

    /**
     * Multiplies in place the current Vector2 coordinates by the given ones
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public multiplyInPlace(otherVector: DeepImmutable<Vector2>): Vector2 {
        this.x *= otherVector.x;
        this.y *= otherVector.y;
        return this;
    }

    /**
     * Returns a new Vector2 set with the multiplication of the current Vector2 and the given one coordinates
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public multiply(otherVector: DeepImmutable<Vector2>): Vector2 {
        return new Vector2(this.x * otherVector.x, this.y * otherVector.y);
    }

    /**
     * Sets "result" coordinates with the multiplication of the current Vector2 and the given one coordinates
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public multiplyToRef(otherVector: DeepImmutable<Vector2>, result: Vector2): Vector2 {
        result.x = this.x * otherVector.x;
        result.y = this.y * otherVector.y;
        return this;
    }

    /**
     * Gets a new Vector2 set with the Vector2 coordinates multiplied by the given floats
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     * @returns a new Vector2
     */
    public multiplyByFloats(x: number, y: number): Vector2 {
        return new Vector2(this.x * x, this.y * y);
    }

    /**
     * Returns a new Vector2 set with the Vector2 coordinates divided by the given one coordinates
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public divide(otherVector: Vector2): Vector2 {
        return new Vector2(this.x / otherVector.x, this.y / otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the Vector2 divided by the given one coordinates
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public divideToRef(otherVector: DeepImmutable<Vector2>, result: Vector2): Vector2 {
        result.x = this.x / otherVector.x;
        result.y = this.y / otherVector.y;
        return this;
    }

    /**
     * Divides the current Vector2 coordinates by the given ones
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public divideInPlace(otherVector: DeepImmutable<Vector2>): Vector2 {
        return this.divideToRef(otherVector, this);
    }

    /**
     * Gets a new Vector2 with current Vector2 negated coordinates
     * @returns a new Vector2
     */
    public negate(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    /**
     * Negate this vector in place
     * @returns this
     */
    public negateInPlace(): Vector2 {
        this.x *= -1;
        this.y *= -1;
        return this;
    }

    /**
     * Negate the current Vector2 and stores the result in the given vector "result" coordinates
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector2
     */
    public negateToRef(result: Vector2): Vector2 {
        return result.copyFromFloats(this.x * -1, this.y * -1);
    }

    /**
     * Multiply the Vector2 coordinates by scale
     * @param scale defines the scaling factor
     * @returns the current updated Vector2
     */
    public scaleInPlace(scale: number): Vector2 {
        this.x *= scale;
        this.y *= scale;
        return this;
    }

    /**
     * Returns a new Vector2 scaled by "scale" from the current Vector2
     * @param scale defines the scaling factor
     * @returns a new Vector2
     */
    public scale(scale: number): Vector2 {
        let result = new Vector2(0, 0);
        this.scaleToRef(scale, result);
        return result;
    }

    /**
     * Scale the current Vector2 values by a factor to a given Vector2
     * @param scale defines the scale factor
     * @param result defines the Vector2 object where to store the result
     * @returns the unmodified current Vector2
     */
    public scaleToRef(scale: number, result: Vector2): Vector2 {
        result.x = this.x * scale;
        result.y = this.y * scale;
        return this;
    }

    /**
     * Scale the current Vector2 values by a factor and add the result to a given Vector2
     * @param scale defines the scale factor
     * @param result defines the Vector2 object where to store the result
     * @returns the unmodified current Vector2
     */
    public scaleAndAddToRef(scale: number, result: Vector2): Vector2 {
        result.x += this.x * scale;
        result.y += this.y * scale;
        return this;
    }

    /**
     * Gets a boolean if two vectors are equals
     * @param otherVector defines the other vector
     * @returns true if the given vector coordinates strictly equal the current Vector2 ones
     */
    public equals(otherVector: DeepImmutable<Vector2>): boolean {
        return otherVector && this.x === otherVector.x && this.y === otherVector.y;
    }

    /**
     * Gets a boolean if two vectors are equals (using an epsilon value)
     * @param otherVector defines the other vector
     * @param epsilon defines the minimal distance to consider equality
     * @returns true if the given vector coordinates are close to the current ones by a distance of epsilon.
     */
    public equalsWithEpsilon(otherVector: DeepImmutable<Vector2>, epsilon: number = Epsilon): boolean {
        return otherVector && Scalar.WithinEpsilon(this.x, otherVector.x, epsilon) && Scalar.WithinEpsilon(this.y, otherVector.y, epsilon);
    }

    /**
     * Gets a new Vector2 from current Vector2 floored values
     * eg (1.2, 2.31) returns (1, 2)
     * @returns a new Vector2
     */
    public floor(): Vector2 {
        return new Vector2(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Gets a new Vector2 from current Vector2 fractional values
     * eg (1.2, 2.31) returns (0.2, 0.31)
     * @returns a new Vector2
     */
    public fract(): Vector2 {
        return new Vector2(this.x - Math.floor(this.x), this.y - Math.floor(this.y));
    }

    /**
     * Rotate the current vector into a given result vector
     * @param angle defines the rotation angle
     * @param result defines the result vector where to store the rotated vector
     * @returns the current vector
     */
    public rotateToRef(angle: number, result: Vector2) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        result.x = cos * this.x - sin * this.y;
        result.y = sin * this.x + cos * this.y;

        return this;
    }

    // Properties

    /**
     * Gets the length of the vector
     * @returns the vector length (float)
     */
    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Gets the vector squared length
     * @returns the vector squared length (float)
     */
    public lengthSquared(): number {
        return (this.x * this.x + this.y * this.y);
    }

    // Methods

    /**
     * Normalize the vector
     * @returns the current updated Vector2
     */
    public normalize(): Vector2 {
        Vector2.NormalizeToRef(this, this);
        return this;
    }

    /**
     * Gets a new Vector2 copied from the Vector2
     * @returns a new Vector2
     */
    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    // Statics

    /**
     * Gets a new Vector2(0, 0)
     * @returns a new Vector2
     */
    public static Zero(): Vector2 {
        return new Vector2(0, 0);
    }

    /**
     * Gets a new Vector2(1, 1)
     * @returns a new Vector2
     */
    public static One(): Vector2 {
        return new Vector2(1, 1);
    }

    /**
     * Gets a new Vector2 set from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @returns a new Vector2
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Vector2 {
        return new Vector2(array[offset], array[offset + 1]);
    }

    /**
     * Sets "result" from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @param result defines the target vector
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number, result: Vector2): void {
        result.x = array[offset];
        result.y = array[offset + 1];
    }

    /**
     * Gets a new Vector2 located for "amount" (float) on the CatmullRom spline defined by the given four Vector2
     * @param value1 defines 1st point of control
     * @param value2 defines 2nd point of control
     * @param value3 defines 3rd point of control
     * @param value4 defines 4th point of control
     * @param amount defines the interpolation factor
     * @returns a new Vector2
     */
    public static CatmullRom(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>, value3: DeepImmutable<Vector2>, value4: DeepImmutable<Vector2>, amount: number): Vector2 {
        var squared = amount * amount;
        var cubed = amount * squared;

        var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
            (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
            ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

        var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
            (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
            ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

        return new Vector2(x, y);
    }

    /**
     * Returns a new Vector2 set with same the coordinates than "value" ones if the vector "value" is in the square defined by "min" and "max".
     * If a coordinate of "value" is lower than "min" coordinates, the returned Vector2 is given this "min" coordinate.
     * If a coordinate of "value" is greater than "max" coordinates, the returned Vector2 is given this "max" coordinate
     * @param value defines the value to clamp
     * @param min defines the lower limit
     * @param max defines the upper limit
     * @returns a new Vector2
     */
    public static Clamp(value: DeepImmutable<Vector2>, min: DeepImmutable<Vector2>, max: DeepImmutable<Vector2>): Vector2 {
        var x = value.x;
        x = (x > max.x) ? max.x : x;
        x = (x < min.x) ? min.x : x;

        var y = value.y;
        y = (y > max.y) ? max.y : y;
        y = (y < min.y) ? min.y : y;

        return new Vector2(x, y);
    }

    /**
     * Returns a new Vector2 located for "amount" (float) on the Hermite spline defined by the vectors "value1", "value2", "tangent1", "tangent2"
     * @param value1 defines the 1st control point
     * @param tangent1 defines the outgoing tangent
     * @param value2 defines the 2nd control point
     * @param tangent2 defines the incoming tangent
     * @param amount defines the interpolation factor
     * @returns a new Vector2
     */
    public static Hermite(value1: DeepImmutable<Vector2>, tangent1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>, tangent2: DeepImmutable<Vector2>, amount: number): Vector2 {
        var squared = amount * amount;
        var cubed = amount * squared;
        var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
        var part2 = (-2.0 * cubed) + (3.0 * squared);
        var part3 = (cubed - (2.0 * squared)) + amount;
        var part4 = cubed - squared;

        var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
        var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);

        return new Vector2(x, y);
    }

    /**
     * Returns a new Vector2 which is the 1st derivative of the Hermite spline defined by the vectors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
     public static Hermite1stDerivative(value1: DeepImmutable<Vector2>, tangent1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>, tangent2: DeepImmutable<Vector2>, time: number): Vector2 {
        let result = Vector2.Zero();

        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);

        return result;
    }

    /**
     * Returns a new Vector2 which is the 1st derivative of the Hermite spline defined by the vectors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where the derivative will be stored
     */
    public static Hermite1stDerivativeToRef(value1: DeepImmutable<Vector2>, tangent1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>, tangent2: DeepImmutable<Vector2>, time: number, result: Vector2) {
        const t2 = time * time;

        result.x = (t2 - time) * 6 * value1.x + (3 * t2 - 4 * time + 1) * tangent1.x + (-t2 + time) * 6 * value2.x + (3 * t2 - 2 * time) * tangent2.x;
        result.y = (t2 - time) * 6 * value1.y + (3 * t2 - 4 * time + 1) * tangent1.y + (-t2 + time) * 6 * value2.y + (3 * t2 - 2 * time) * tangent2.y;
    }

    /**
     * Returns a new Vector2 located for "amount" (float) on the linear interpolation between the vector "start" adn the vector "end".
     * @param start defines the start vector
     * @param end defines the end vector
     * @param amount defines the interpolation factor
     * @returns a new Vector2
     */
    public static Lerp(start: DeepImmutable<Vector2>, end: DeepImmutable<Vector2>, amount: number): Vector2 {
        var x = start.x + ((end.x - start.x) * amount);
        var y = start.y + ((end.y - start.y) * amount);
        return new Vector2(x, y);
    }

    /**
     * Gets the dot product of the vector "left" and the vector "right"
     * @param left defines first vector
     * @param right defines second vector
     * @returns the dot product (float)
     */
    public static Dot(left: DeepImmutable<Vector2>, right: DeepImmutable<Vector2>): number {
        return left.x * right.x + left.y * right.y;
    }

    /**
     * Returns a new Vector2 equal to the normalized given vector
     * @param vector defines the vector to normalize
     * @returns a new Vector2
     */
    public static Normalize(vector: DeepImmutable<Vector2>): Vector2 {
        var newVector = Vector2.Zero();
        this.NormalizeToRef(vector, newVector);
        return newVector;
    }

    /**
     * Normalize a given vector into a second one
     * @param vector defines the vector to normalize
     * @param result defines the vector where to store the result
     */
     public static NormalizeToRef(vector: DeepImmutable<Vector2>, result: Vector2) {
        var len = vector.length();

        if (len === 0) {
            return;
        }

        result.x = vector.x / len;
        result.y = vector.y / len;
    }

    /**
     * Gets a new Vector2 set with the minimal coordinate values from the "left" and "right" vectors
     * @param left defines 1st vector
     * @param right defines 2nd vector
     * @returns a new Vector2
     */
    public static Minimize(left: DeepImmutable<Vector2>, right: DeepImmutable<Vector2>): Vector2 {
        var x = (left.x < right.x) ? left.x : right.x;
        var y = (left.y < right.y) ? left.y : right.y;
        return new Vector2(x, y);
    }

    /**
     * Gets a new Vecto2 set with the maximal coordinate values from the "left" and "right" vectors
     * @param left defines 1st vector
     * @param right defines 2nd vector
     * @returns a new Vector2
     */
    public static Maximize(left: DeepImmutable<Vector2>, right: DeepImmutable<Vector2>): Vector2 {
        var x = (left.x > right.x) ? left.x : right.x;
        var y = (left.y > right.y) ? left.y : right.y;
        return new Vector2(x, y);
    }

    /**
     * Gets a new Vector2 set with the transformed coordinates of the given vector by the given transformation matrix
     * @param vector defines the vector to transform
     * @param transformation defines the matrix to apply
     * @returns a new Vector2
     */
    public static Transform(vector: DeepImmutable<Vector2>, transformation: DeepImmutable<Matrix>): Vector2 {
        let r = Vector2.Zero();
        Vector2.TransformToRef(vector, transformation, r);
        return r;
    }

    /**
     * Transforms the given vector coordinates by the given transformation matrix and stores the result in the vector "result" coordinates
     * @param vector defines the vector to transform
     * @param transformation defines the matrix to apply
     * @param result defines the target vector
     */
    public static TransformToRef(vector: DeepImmutable<Vector2>, transformation: DeepImmutable<Matrix>, result: Vector2) {
        const m = transformation.m;
        var x = (vector.x * m[0]) + (vector.y * m[4]) + m[12];
        var y = (vector.x * m[1]) + (vector.y * m[5]) + m[13];
        result.x = x;
        result.y = y;
    }

    /**
     * Determines if a given vector is included in a triangle
     * @param p defines the vector to test
     * @param p0 defines 1st triangle point
     * @param p1 defines 2nd triangle point
     * @param p2 defines 3rd triangle point
     * @returns true if the point "p" is in the triangle defined by the vertors "p0", "p1", "p2"
     */
    public static PointInTriangle(p: DeepImmutable<Vector2>, p0: DeepImmutable<Vector2>, p1: DeepImmutable<Vector2>, p2: DeepImmutable<Vector2>) {
        let a = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
        let sign = a < 0 ? -1 : 1;
        let s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
        let t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

        return s > 0 && t > 0 && (s + t) < 2 * a * sign;
    }

    /**
     * Gets the distance between the vectors "value1" and "value2"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @returns the distance between vectors
     */
    public static Distance(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>): number {
        return Math.sqrt(Vector2.DistanceSquared(value1, value2));
    }

    /**
     * Returns the squared distance between the vectors "value1" and "value2"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @returns the squared distance between vectors
     */
    public static DistanceSquared(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>): number {
        var x = value1.x - value2.x;
        var y = value1.y - value2.y;
        return (x * x) + (y * y);
    }

    /**
     * Gets a new Vector2 located at the center of the vectors "value1" and "value2"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @returns a new Vector2
     */
    public static Center(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>): Vector2 {
        return Vector2.CenterToRef(value1, value2, Vector2.Zero());
    }

    /**
     * Gets the center of the vectors "value1" and "value2" and stores the result in the vector "ref"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @param ref defines third vector
     * @returns ref
     */
    public static CenterToRef(value1: DeepImmutable<Vector2>, value2: DeepImmutable<Vector2>, ref: DeepImmutable<Vector2>): Vector2 {
        return ref.copyFromFloats((value1.x + value2.x) / 2, (value1.y + value2.y) / 2);
    }

    /**
     * Gets the shortest distance (float) between the point "p" and the segment defined by the two points "segA" and "segB".
     * @param p defines the middle point
     * @param segA defines one point of the segment
     * @param segB defines the other point of the segment
     * @returns the shortest distance
     */
    public static DistanceOfPointFromSegment(p: DeepImmutable<Vector2>, segA: DeepImmutable<Vector2>, segB: DeepImmutable<Vector2>): number {
        let l2 = Vector2.DistanceSquared(segA, segB);
        if (l2 === 0.0) {
            return Vector2.Distance(p, segA);
        }
        let v = segB.subtract(segA);
        let t = Math.max(0, Math.min(1, Vector2.Dot(p.subtract(segA), v) / l2));
        let proj = segA.add(v.multiplyByFloats(t, t));
        return Vector2.Distance(p, proj);
    }
}

/**
 * Class used to store (x,y,z) vector representation
 * A Vector3 is the main object used in 3D geometry
 * It can represent etiher the coordinates of a point the space, either a direction
 * Reminder: js uses a left handed forward facing system
 */
export class Vector3 {
    private static _UpReadOnly = Vector3.Up() as DeepImmutable<Vector3>;
    private static _ZeroReadOnly = Vector3.Zero() as DeepImmutable<Vector3>;

    /** @hidden */
    public _x: number;

    /** @hidden */
    public _y: number;

    /** @hidden */
    public _z: number;

    /** @hidden */
    public _isDirty = true;

    /** Gets or sets the x coordinate */
    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
        this._isDirty = true;
    }

    /** Gets or sets the y coordinate */
    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
        this._isDirty = true;
    }

    /** Gets or sets the z coordinate */
    public get z() {
        return this._z;
    }

    public set z(value: number) {
        this._z = value;
        this._isDirty = true;
    }

    /**
     * Creates a new Vector3 object from the given x, y, z (floats) coordinates.
     * @param x defines the first coordinates (on X axis)
     * @param y defines the second coordinates (on Y axis)
     * @param z defines the third coordinates (on Z axis)
     */
    constructor(
        x: number = 0,
        y: number = 0,
        z: number = 0
    ) {
        this._x = x;
        this._y = y;
        this._z = z;
    }

    /**
     * Creates a string representation of the Vector3
     * @returns a string with the Vector3 coordinates.
     */
    public toString(): string {
        return `{X: ${this._x} Y: ${this._y} Z: ${this._z}}`;
    }

    /**
     * Gets the class name
     * @returns the string "Vector3"
     */
    public getClassName(): string {
        return "Vector3";
    }

    /**
     * Creates the Vector3 hash code
     * @returns a number which tends to be unique between Vector3 instances
     */
    public getHashCode(): number {
        let hash = this._x | 0;
        hash = (hash * 397) ^ (this._y | 0);
        hash = (hash * 397) ^ (this._z | 0);
        return hash;
    }

    // Operators

    /**
     * Creates an array containing three elements : the coordinates of the Vector3
     * @returns a new array of numbers
     */
    public asArray(): number[] {
        var result: number[] = [];
        this.toArray(result, 0);
        return result;
    }

    /**
     * Populates the given array or Float32Array from the given index with the successive coordinates of the Vector3
     * @param array defines the destination array
     * @param index defines the offset in the destination array
     * @returns the current Vector3
     */
    public toArray(array: FloatArray, index: number = 0): Vector3 {
        array[index] = this._x;
        array[index + 1] = this._y;
        array[index + 2] = this._z;
        return this;
    }

    /**
     * Update the current vector from an array
     * @param array defines the destination array
     * @param index defines the offset in the destination array
     * @returns the current Vector3
     */
    public fromArray(array: FloatArray, index: number = 0): Vector3 {
        Vector3.FromArrayToRef(array, index, this);
        return this;
    }

    /**
     * Converts the current Vector3 into a quaternion (considering that the Vector3 contains Euler angles representation of a rotation)
     * @returns a new Quaternion object, computed from the Vector3 coordinates
     */
    public toQuaternion(): Quaternion {
        return Quaternion.RotationYawPitchRoll(this._y, this._x, this._z);
    }

    /**
     * Adds the given vector to the current Vector3
     * @param otherVector defines the second operand
     * @returns the current updated Vector3
     */
    public addInPlace(otherVector: DeepImmutable<Vector3>): Vector3 {
        return this.addInPlaceFromFloats(otherVector._x, otherVector._y, otherVector._z);
    }

    /**
     * Adds the given coordinates to the current Vector3
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3
     */
    public addInPlaceFromFloats(x: number, y: number, z: number): Vector3 {
        this.x += x;
        this.y += y;
        this.z += z;
        return this;
    }

    /**
     * Gets a new Vector3, result of the addition the current Vector3 and the given vector
     * @param otherVector defines the second operand
     * @returns the resulting Vector3
     */
    public add(otherVector: DeepImmutable<Vector3>): Vector3 {
        return new Vector3(this._x + otherVector._x, this._y + otherVector._y, this._z + otherVector._z);
    }

    /**
     * Adds the current Vector3 to the given one and stores the result in the vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public addToRef(otherVector: DeepImmutable<Vector3>, result: Vector3): Vector3 {
        return result.copyFromFloats(this._x + otherVector._x, this._y + otherVector._y, this._z + otherVector._z);
    }

    /**
     * Subtract the given vector from the current Vector3
     * @param otherVector defines the second operand
     * @returns the current updated Vector3
     */
    public subtractInPlace(otherVector: DeepImmutable<Vector3>): Vector3 {
        this.x -= otherVector._x;
        this.y -= otherVector._y;
        this.z -= otherVector._z;
        return this;
    }

    /**
     * Returns a new Vector3, result of the subtraction of the given vector from the current Vector3
     * @param otherVector defines the second operand
     * @returns the resulting Vector3
     */
    public subtract(otherVector: DeepImmutable<Vector3>): Vector3 {
        return new Vector3(this._x - otherVector._x, this._y - otherVector._y, this._z - otherVector._z);
    }

    /**
     * Subtracts the given vector from the current Vector3 and stores the result in the vector "result".
     * @param otherVector defines the second operand
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public subtractToRef(otherVector: DeepImmutable<Vector3>, result: Vector3): Vector3 {
        return this.subtractFromFloatsToRef(otherVector._x, otherVector._y, otherVector._z, result);
    }

    /**
     * Returns a new Vector3 set with the subtraction of the given floats from the current Vector3 coordinates
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the resulting Vector3
     */
    public subtractFromFloats(x: number, y: number, z: number): Vector3 {
        return new Vector3(this._x - x, this._y - y, this._z - z);
    }

    /**
     * Subtracts the given floats from the current Vector3 coordinates and set the given vector "result" with this result
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): Vector3 {
        return result.copyFromFloats(this._x - x, this._y - y, this._z - z);
    }

    /**
     * Gets a new Vector3 set with the current Vector3 negated coordinates
     * @returns a new Vector3
     */
    public negate(): Vector3 {
        return new Vector3(-this._x, -this._y, -this._z);
    }

    /**
     * Negate this vector in place
     * @returns this
     */
    public negateInPlace(): Vector3 {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }

    /**
     * Negate the current Vector3 and stores the result in the given vector "result" coordinates
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public negateToRef(result: Vector3): Vector3 {
        return result.copyFromFloats(this._x * -1, this._y * -1, this._z * -1);
    }

    /**
     * Multiplies the Vector3 coordinates by the float "scale"
     * @param scale defines the multiplier factor
     * @returns the current updated Vector3
     */
    public scaleInPlace(scale: number): Vector3 {
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
        return this;
    }

    /**
     * Returns a new Vector3 set with the current Vector3 coordinates multiplied by the float "scale"
     * @param scale defines the multiplier factor
     * @returns a new Vector3
     */
    public scale(scale: number): Vector3 {
        return new Vector3(this._x * scale, this._y * scale, this._z * scale);
    }

    /**
     * Multiplies the current Vector3 coordinates by the float "scale" and stores the result in the given vector "result" coordinates
     * @param scale defines the multiplier factor
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public scaleToRef(scale: number, result: Vector3): Vector3 {
        return result.copyFromFloats(this._x * scale, this._y * scale, this._z * scale);
    }

    /**
     * Scale the current Vector3 values by a factor and add the result to a given Vector3
     * @param scale defines the scale factor
     * @param result defines the Vector3 object where to store the result
     * @returns the unmodified current Vector3
     */
    public scaleAndAddToRef(scale: number, result: Vector3): Vector3 {
        return result.addInPlaceFromFloats(this._x * scale, this._y * scale, this._z * scale);
    }

    /**
     * Projects the current vector3 to a plane along a ray starting from a specified origin and directed towards the point.
     * @param origin defines the origin of the projection ray
     * @param plane defines the plane to project to
     * @returns the projected vector3
     */
    public projectOnPlane(plane: Plane, origin: Vector3): Vector3 {
        let result = Vector3.Zero();

        this.projectOnPlaneToRef(plane, origin, result);

        return result;
    }

    /**
     * Projects the current vector3 to a plane along a ray starting from a specified origin and directed towards the point.
     * @param origin defines the origin of the projection ray
     * @param plane defines the plane to project to
     * @param result defines the Vector3 where to store the result
     */
    public projectOnPlaneToRef(plane: Plane, origin: Vector3, result: Vector3): void {
        let n = plane.normal;
        let d = plane.d;

        let V = MathTmp.Vector3[0];

        // ray direction
        this.subtractToRef(origin, V);

        V.normalize();

        let denom = Vector3.Dot(V, n);
        let t = -(Vector3.Dot(origin, n) + d) / denom;

        // P = P0 + t*V
        let scaledV = V.scaleInPlace(t);
        origin.addToRef(scaledV, result);
    }

    /**
     * Returns true if the current Vector3 and the given vector coordinates are strictly equal
     * @param otherVector defines the second operand
     * @returns true if both vectors are equals
     */
    public equals(otherVector: DeepImmutable<Vector3>): boolean {
        return otherVector && this._x === otherVector._x && this._y === otherVector._y && this._z === otherVector._z;
    }

    /**
     * Returns true if the current Vector3 and the given vector coordinates are distant less than epsilon
     * @param otherVector defines the second operand
     * @param epsilon defines the minimal distance to define values as equals
     * @returns true if both vectors are distant less than epsilon
     */
    public equalsWithEpsilon(otherVector: DeepImmutable<Vector3>, epsilon: number = Epsilon): boolean {
        return otherVector && Scalar.WithinEpsilon(this._x, otherVector._x, epsilon) && Scalar.WithinEpsilon(this._y, otherVector._y, epsilon) && Scalar.WithinEpsilon(this._z, otherVector._z, epsilon);
    }

    /**
     * Returns true if the current Vector3 coordinates equals the given floats
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns true if both vectors are equals
     */
    public equalsToFloats(x: number, y: number, z: number): boolean {
        return this._x === x && this._y === y && this._z === z;
    }

    /**
     * Multiplies the current Vector3 coordinates by the given ones
     * @param otherVector defines the second operand
     * @returns the current updated Vector3
     */
    public multiplyInPlace(otherVector: DeepImmutable<Vector3>): Vector3 {
        this.x *= otherVector._x;
        this.y *= otherVector._y;
        this.z *= otherVector._z;
        return this;
    }

    /**
     * Returns a new Vector3, result of the multiplication of the current Vector3 by the given vector
     * @param otherVector defines the second operand
     * @returns the new Vector3
     */
    public multiply(otherVector: DeepImmutable<Vector3>): Vector3 {
        return this.multiplyByFloats(otherVector._x, otherVector._y, otherVector._z);
    }

    /**
     * Multiplies the current Vector3 by the given one and stores the result in the given vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public multiplyToRef(otherVector: DeepImmutable<Vector3>, result: Vector3): Vector3 {
        return result.copyFromFloats(this._x * otherVector._x, this._y * otherVector._y, this._z * otherVector._z);
    }

    /**
     * Returns a new Vector3 set with the result of the mulliplication of the current Vector3 coordinates by the given floats
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the new Vector3
     */
    public multiplyByFloats(x: number, y: number, z: number): Vector3 {
        return new Vector3(this._x * x, this._y * y, this._z * z);
    }

    /**
     * Returns a new Vector3 set with the result of the division of the current Vector3 coordinates by the given ones
     * @param otherVector defines the second operand
     * @returns the new Vector3
     */
    public divide(otherVector: DeepImmutable<Vector3>): Vector3 {
        return new Vector3(this._x / otherVector._x, this._y / otherVector._y, this._z / otherVector._z);
    }

    /**
     * Divides the current Vector3 coordinates by the given ones and stores the result in the given vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector3
     */
    public divideToRef(otherVector: DeepImmutable<Vector3>, result: Vector3): Vector3 {
        return result.copyFromFloats(this._x / otherVector._x, this._y / otherVector._y, this._z / otherVector._z);
    }

    /**
     * Divides the current Vector3 coordinates by the given ones.
     * @param otherVector defines the second operand
     * @returns the current updated Vector3
     */
    public divideInPlace(otherVector: Vector3): Vector3 {
        return this.divideToRef(otherVector, this);
    }

    /**
     * Updates the current Vector3 with the minimal coordinate values between its and the given vector ones
     * @param other defines the second operand
     * @returns the current updated Vector3
     */
    public minimizeInPlace(other: DeepImmutable<Vector3>): Vector3 {
        return this.minimizeInPlaceFromFloats(other._x, other._y, other._z);
    }

    /**
     * Updates the current Vector3 with the maximal coordinate values between its and the given vector ones.
     * @param other defines the second operand
     * @returns the current updated Vector3
     */
    public maximizeInPlace(other: DeepImmutable<Vector3>): Vector3 {
        return this.maximizeInPlaceFromFloats(other._x, other._y, other._z);
    }

    /**
     * Updates the current Vector3 with the minimal coordinate values between its and the given coordinates
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3
     */
    public minimizeInPlaceFromFloats(x: number, y: number, z: number): Vector3 {
        if (x < this._x) { this.x = x; }
        if (y < this._y) { this.y = y; }
        if (z < this._z) { this.z = z; }
        return this;
    }

    /**
     * Updates the current Vector3 with the maximal coordinate values between its and the given coordinates.
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3
     */
    public maximizeInPlaceFromFloats(x: number, y: number, z: number): Vector3 {
        if (x > this._x) { this.x = x; }
        if (y > this._y) { this.y = y; }
        if (z > this._z) { this.z = z; }
        return this;
    }

    /**
     * Due to float precision, scale of a mesh could be uniform but float values are off by a small fraction
     * Check if is non uniform within a certain amount of decimal places to account for this
     * @param epsilon the amount the values can differ
     * @returns if the the vector is non uniform to a certain number of decimal places
     */
    public isNonUniformWithinEpsilon(epsilon: number) {
        let absX = Math.abs(this._x);
        let absY = Math.abs(this._y);
        if (!Scalar.WithinEpsilon(absX, absY, epsilon)) {
            return true;
        }

        let absZ = Math.abs(this._z);
        if (!Scalar.WithinEpsilon(absX, absZ, epsilon)) {
            return true;
        }

        if (!Scalar.WithinEpsilon(absY, absZ, epsilon)) {
            return true;
        }

        return false;
    }

    /**
     * Gets a boolean indicating that the vector is non uniform meaning x, y or z are not all the same
     */
    public get isNonUniform(): boolean {
        let absX = Math.abs(this._x);
        let absY = Math.abs(this._y);
        if (absX !== absY) {
            return true;
        }

        let absZ = Math.abs(this._z);
        if (absX !== absZ) {
            return true;
        }

        return false;
    }

    /**
     * Gets a new Vector3 from current Vector3 floored values
     * @returns a new Vector3
     */
    public floor(): Vector3 {
        return new Vector3(Math.floor(this._x), Math.floor(this._y), Math.floor(this._z));
    }

    /**
     * Gets a new Vector3 from current Vector3 floored values
     * @returns a new Vector3
     */
    public fract(): Vector3 {
        return new Vector3(this._x - Math.floor(this._x), this._y - Math.floor(this._y), this._z - Math.floor(this._z));
    }

    // Properties
    /**
     * Gets the length of the Vector3
     * @returns the length of the Vector3
     */
    public length(): number {
        return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
    }

    /**
     * Gets the squared length of the Vector3
     * @returns squared length of the Vector3
     */
    public lengthSquared(): number {
        return (this._x * this._x + this._y * this._y + this._z * this._z);
    }

    /**
     * Normalize the current Vector3.
     * Please note that this is an in place operation.
     * @returns the current updated Vector3
     */
    public normalize(): Vector3 {
        return this.normalizeFromLength(this.length());
    }

    /**
     * Reorders the x y z properties of the vector in place
     * @param order new ordering of the properties (eg. for vector 1,2,3 with "ZYX" will produce 3,2,1)
     * @returns the current updated vector
     */
    public reorderInPlace(order: string) {
        order = order.toLowerCase();
        if (order === "xyz") {
            return this;
        }
        MathTmp.Vector3[0].copyFrom(this);
        ["x", "y", "z"].forEach((val, i) => {
            (<any>this)[val] = (<any>MathTmp.Vector3[0])[order[i]];
        });
        return this;
    }

    /**
     * Rotates the vector around 0,0,0 by a quaternion
     * @param quaternion the rotation quaternion
     * @param result vector to store the result
     * @returns the resulting vector
     */
    public rotateByQuaternionToRef(quaternion: Quaternion, result: Vector3) {
        quaternion.toRotationMatrix(MathTmp.Matrix[0]);
        Vector3.TransformCoordinatesToRef(this, MathTmp.Matrix[0], result);
        return result;
    }

    /**
     * Rotates a vector around a given point
     * @param quaternion the rotation quaternion
     * @param point the point to rotate around
     * @param result vector to store the result
     * @returns the resulting vector
     */
    public rotateByQuaternionAroundPointToRef(quaternion: Quaternion, point: Vector3, result: Vector3) {
        this.subtractToRef(point, MathTmp.Vector3[0]);
        MathTmp.Vector3[0].rotateByQuaternionToRef(quaternion, MathTmp.Vector3[0]);
        point.addToRef(MathTmp.Vector3[0], result);
        return result;
    }

    /**
     * Returns a new Vector3 as the cross product of the current vector and the "other" one
     * The cross product is then orthogonal to both current and "other"
     * @param other defines the right operand
     * @returns the cross product
     */
    public cross(other: Vector3) {
        return Vector3.Cross(this, other);
    }

    /**
     * Normalize the current Vector3 with the given input length.
     * Please note that this is an in place operation.
     * @param len the length of the vector
     * @returns the current updated Vector3
     */
    public normalizeFromLength(len: number): Vector3 {
        if (len === 0 || len === 1.0) {
            return this;
        }

        return this.scaleInPlace(1.0 / len);
    }

    /**
     * Normalize the current Vector3 to a new vector
     * @returns the new Vector3
     */
    public normalizeToNew(): Vector3 {
        const normalized = new Vector3(0, 0, 0);
        this.normalizeToRef(normalized);
        return normalized;
    }

    /**
     * Normalize the current Vector3 to the reference
     * @param reference define the Vector3 to update
     * @returns the updated Vector3
     */
    public normalizeToRef(reference: Vector3): Vector3 {
        var len = this.length();
        if (len === 0 || len === 1.0) {
            return reference.copyFromFloats(this._x, this._y, this._z);
        }

        return this.scaleToRef(1.0 / len, reference);
    }

    /**
     * Creates a new Vector3 copied from the current Vector3
     * @returns the new Vector3
     */
    public clone(): Vector3 {
        return new Vector3(this._x, this._y, this._z);
    }

    /**
     * Copies the given vector coordinates to the current Vector3 ones
     * @param source defines the source Vector3
     * @returns the current updated Vector3
     */
    public copyFrom(source: DeepImmutable<Vector3>): Vector3 {
        return this.copyFromFloats(source._x, source._y, source._z);
    }

    /**
     * Copies the given floats to the current Vector3 coordinates
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3
     */
    public copyFromFloats(x: number, y: number, z: number): Vector3 {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Copies the given floats to the current Vector3 coordinates
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3
     */
    public set(x: number, y: number, z: number): Vector3 {
        return this.copyFromFloats(x, y, z);
    }

    /**
     * Copies the given float to the current Vector3 coordinates
     * @param v defines the x, y and z coordinates of the operand
     * @returns the current updated Vector3
     */
    public setAll(v: number): Vector3 {
        this.x = this.y = this.z = v;
        return this;
    }

    // Statics

    /**
     * Get the clip factor between two vectors
     * @param vector0 defines the first operand
     * @param vector1 defines the second operand
     * @param axis defines the axis to use
     * @param size defines the size along the axis
     * @returns the clip factor
     */
    public static GetClipFactor(vector0: DeepImmutable<Vector3>, vector1: DeepImmutable<Vector3>, axis: DeepImmutable<Vector3>, size: number) {
        var d0 = Vector3.Dot(vector0, axis) - size;
        var d1 = Vector3.Dot(vector1, axis) - size;

        var s = d0 / (d0 - d1);

        return s;
    }

    /**
     * Get angle between two vectors
     * @param vector0 angle between vector0 and vector1
     * @param vector1 angle between vector0 and vector1
     * @param normal direction of the normal
     * @return the angle between vector0 and vector1
     */
    public static GetAngleBetweenVectors(vector0: DeepImmutable<Vector3>, vector1: DeepImmutable<Vector3>, normal: DeepImmutable<Vector3>): number {
        const v0: Vector3 = vector0.normalizeToRef(MathTmp.Vector3[1]);
        const v1: Vector3 = vector1.normalizeToRef(MathTmp.Vector3[2]);
        const dot: number = Vector3.Dot(v0, v1);
        const angle = Math.acos(dot);
        const n = MathTmp.Vector3[3];
        Vector3.CrossToRef(v0, v1, n);
        if (Vector3.Dot(n, normal) > 0) {
            return isNaN(angle) ? 0 : angle;
        }
        return isNaN(angle) ? -Math.PI : -Math.acos(dot);
    }

    /**
     * Get angle between two vectors projected on a plane
     * @param vector0 angle between vector0 and vector1
     * @param vector1 angle between vector0 and vector1
     * @param normal Normal of the projection plane
     * @returns the angle between vector0 and vector1 projected on the plane with the specified normal
     */
    public static GetAngleBetweenVectorsOnPlane(vector0: Vector3, vector1: Vector3, normal: Vector3) {
        MathTmp.Vector3[0].copyFrom(vector0);
        const v0 = MathTmp.Vector3[0];
        MathTmp.Vector3[1].copyFrom(vector1);
        const v1 = MathTmp.Vector3[1];
        MathTmp.Vector3[2].copyFrom(normal);
        const vNormal = MathTmp.Vector3[2];
        const right = MathTmp.Vector3[3];
        const forward = MathTmp.Vector3[4];

        v0.normalize();
        v1.normalize();
        vNormal.normalize();

        Vector3.CrossToRef(vNormal, v0, right);
        Vector3.CrossToRef(right, vNormal, forward);

        const angle = Math.atan2(Vector3.Dot(v1, right), Vector3.Dot(v1, forward));

        return Scalar.NormalizeRadians(angle);
    }

    /**
     * Slerp between two vectors. See also `SmoothToRef`
     * @param vector0 Start vector
     * @param vector1 End vector
     * @param slerp amount (will be clamped between 0 and 1)
     * @param result The slerped vector
     */
    public static SlerpToRef(vector0: Vector3, vector1: Vector3, slerp: number, result: Vector3) {
        slerp = Scalar.Clamp(slerp, 0, 1);
        const vector0Dir = MathTmp.Vector3[0];
        const vector1Dir = MathTmp.Vector3[1];
        let vector0Length;
        let vector1Length;

        vector0Dir.copyFrom(vector0);
        vector0Length = vector0Dir.length();
        vector0Dir.normalizeFromLength(vector0Length);

        vector1Dir.copyFrom(vector1);
        vector1Length = vector1Dir.length();
        vector1Dir.normalizeFromLength(vector1Length);

        const dot = Vector3.Dot(vector0Dir, vector1Dir);

        let scale0;
        let scale1;

        if (dot < 1 - Epsilon) {
            const omega = Math.acos(dot);
            const invSin = 1 / Math.sin(omega);
            scale0 = Math.sin((1 - slerp) * omega) * invSin;
            scale1 = Math.sin(slerp * omega) * invSin;
        } else {
            // Use linear interpolation
            scale0 = 1 - slerp;
            scale1 = slerp;
        }

        vector0Dir.scaleInPlace(scale0);
        vector1Dir.scaleInPlace(scale1);
        result.copyFrom(vector0Dir).addInPlace(vector1Dir);
        result.scaleInPlace(Scalar.Lerp(vector0Length, vector1Length, slerp));
    }

    /**
     * Smooth interpolation between two vectors using Slerp
     * @param source source vector
     * @param goal goal vector
     * @param deltaTime current interpolation frame
     * @param lerpTime total interpolation time
     * @param result the smoothed vector
     */
    public static SmoothToRef(source: Vector3, goal: Vector3, deltaTime: number, lerpTime: number, result: Vector3) {
        Vector3.SlerpToRef(source, goal, lerpTime === 0 ? 1 : deltaTime / lerpTime, result);
    }

    /**
     * Returns a new Vector3 set from the index "offset" of the given array
     * @param array defines the source array
     * @param offset defines the offset in the source array
     * @returns the new Vector3
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Vector3 {
        return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
    }

    /**
     * Returns a new Vector3 set from the index "offset" of the given Float32Array
     * @param array defines the source array
     * @param offset defines the offset in the source array
     * @returns the new Vector3
     * @deprecated Please use FromArray instead.
     */
    public static FromFloatArray(array: DeepImmutable<Float32Array>, offset?: number): Vector3 {
        return Vector3.FromArray(array, offset);
    }

    /**
     * Sets the given vector "result" with the element values from the index "offset" of the given array
     * @param array defines the source array
     * @param offset defines the offset in the source array
     * @param result defines the Vector3 where to store the result
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number, result: Vector3): void {
        result.x = array[offset];
        result.y = array[offset + 1];
        result.z = array[offset + 2];
    }

    /**
     * Sets the given vector "result" with the element values from the index "offset" of the given Float32Array
     * @param array defines the source array
     * @param offset defines the offset in the source array
     * @param result defines the Vector3 where to store the result
     * @deprecated Please use FromArrayToRef instead.
     */
    public static FromFloatArrayToRef(array: DeepImmutable<Float32Array>, offset: number, result: Vector3): void {
        return Vector3.FromArrayToRef(array, offset, result);
    }

    /**
     * Sets the given vector "result" with the given floats.
     * @param x defines the x coordinate of the source
     * @param y defines the y coordinate of the source
     * @param z defines the z coordinate of the source
     * @param result defines the Vector3 where to store the result
     */
    public static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void {
        result.copyFromFloats(x, y, z);
    }

    /**
     * Returns a new Vector3 set to (0.0, 0.0, 0.0)
     * @returns a new empty Vector3
     */
    public static Zero(): Vector3 {
        return new Vector3(0.0, 0.0, 0.0);
    }
    /**
     * Returns a new Vector3 set to (1.0, 1.0, 1.0)
     * @returns a new unit Vector3
     */
    public static One(): Vector3 {
        return new Vector3(1.0, 1.0, 1.0);
    }
    /**
     * Returns a new Vector3 set to (0.0, 1.0, 0.0)
     * @returns a new up Vector3
     */
    public static Up(): Vector3 {
        return new Vector3(0.0, 1.0, 0.0);
    }

    /**
     * Gets a up Vector3 that must not be updated
     */
    public static get UpReadOnly(): DeepImmutable<Vector3> {
        return Vector3._UpReadOnly;
    }

    /**
     * Gets a zero Vector3 that must not be updated
     */
    public static get ZeroReadOnly(): DeepImmutable<Vector3> {
        return Vector3._ZeroReadOnly;
    }

    /**
     * Returns a new Vector3 set to (0.0, -1.0, 0.0)
     * @returns a new down Vector3
     */
    public static Down(): Vector3 {
        return new Vector3(0.0, -1.0, 0.0);
    }
    /**
     * Returns a new Vector3 set to (0.0, 0.0, 1.0)
     * @param rightHandedSystem is the scene right-handed (negative z)
     * @returns a new forward Vector3
     */
    public static Forward(rightHandedSystem: boolean = false): Vector3 {
        return new Vector3(0.0, 0.0, (rightHandedSystem ? -1.0 : 1.0));
    }
    /**
     * Returns a new Vector3 set to (0.0, 0.0, -1.0)
     * @param rightHandedSystem is the scene right-handed (negative-z)
     * @returns a new forward Vector3
     */
    public static Backward(rightHandedSystem: boolean = false): Vector3 {
        return new Vector3(0.0, 0.0, (rightHandedSystem ? 1.0 : -1.0));
    }
    /**
     * Returns a new Vector3 set to (1.0, 0.0, 0.0)
     * @returns a new right Vector3
     */
    public static Right(): Vector3 {
        return new Vector3(1.0, 0.0, 0.0);
    }
    /**
     * Returns a new Vector3 set to (-1.0, 0.0, 0.0)
     * @returns a new left Vector3
     */
    public static Left(): Vector3 {
        return new Vector3(-1.0, 0.0, 0.0);
    }

    /**
     * Returns a new Vector3 set with the result of the transformation by the given matrix of the given vector.
     * This method computes tranformed coordinates only, not transformed direction vectors (ie. it takes translation in account)
     * @param vector defines the Vector3 to transform
     * @param transformation defines the transformation matrix
     * @returns the transformed Vector3
     */
    public static TransformCoordinates(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>): Vector3 {
        var result = Vector3.Zero();
        Vector3.TransformCoordinatesToRef(vector, transformation, result);
        return result;
    }

    /**
     * Sets the given vector "result" coordinates with the result of the transformation by the given matrix of the given vector
     * This method computes tranformed coordinates only, not transformed direction vectors (ie. it takes translation in account)
     * @param vector defines the Vector3 to transform
     * @param transformation defines the transformation matrix
     * @param result defines the Vector3 where to store the result
     */
    public static TransformCoordinatesToRef(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>, result: Vector3): void {
        Vector3.TransformCoordinatesFromFloatsToRef(vector._x, vector._y, vector._z, transformation, result);
    }

    /**
     * Sets the given vector "result" coordinates with the result of the transformation by the given matrix of the given floats (x, y, z)
     * This method computes tranformed coordinates only, not transformed direction vectors
     * @param x define the x coordinate of the source vector
     * @param y define the y coordinate of the source vector
     * @param z define the z coordinate of the source vector
     * @param transformation defines the transformation matrix
     * @param result defines the Vector3 where to store the result
     */
    public static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: DeepImmutable<Matrix>, result: Vector3): void {
        const m = transformation.m;
        var rx = x * m[0] + y * m[4] + z * m[8] + m[12];
        var ry = x * m[1] + y * m[5] + z * m[9] + m[13];
        var rz = x * m[2] + y * m[6] + z * m[10] + m[14];
        var rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);

        result.x = rx * rw;
        result.y = ry * rw;
        result.z = rz * rw;
    }

    /**
     * Returns a new Vector3 set with the result of the normal transformation by the given matrix of the given vector
     * This methods computes transformed normalized direction vectors only (ie. it does not apply translation)
     * @param vector defines the Vector3 to transform
     * @param transformation defines the transformation matrix
     * @returns the new Vector3
     */
    public static TransformNormal(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>): Vector3 {
        var result = Vector3.Zero();
        Vector3.TransformNormalToRef(vector, transformation, result);
        return result;
    }

    /**
     * Sets the given vector "result" with the result of the normal transformation by the given matrix of the given vector
     * This methods computes transformed normalized direction vectors only (ie. it does not apply translation)
     * @param vector defines the Vector3 to transform
     * @param transformation defines the transformation matrix
     * @param result defines the Vector3 where to store the result
     */
    public static TransformNormalToRef(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>, result: Vector3): void {
        this.TransformNormalFromFloatsToRef(vector._x, vector._y, vector._z, transformation, result);
    }

    /**
     * Sets the given vector "result" with the result of the normal transformation by the given matrix of the given floats (x, y, z)
     * This methods computes transformed normalized direction vectors only (ie. it does not apply translation)
     * @param x define the x coordinate of the source vector
     * @param y define the y coordinate of the source vector
     * @param z define the z coordinate of the source vector
     * @param transformation defines the transformation matrix
     * @param result defines the Vector3 where to store the result
     */
    public static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: DeepImmutable<Matrix>, result: Vector3): void {
        const m = transformation.m;
        result.x = x * m[0] + y * m[4] + z * m[8];
        result.y = x * m[1] + y * m[5] + z * m[9];
        result.z = x * m[2] + y * m[6] + z * m[10];
    }

    /**
     * Returns a new Vector3 located for "amount" on the CatmullRom interpolation spline defined by the vectors "value1", "value2", "value3", "value4"
     * @param value1 defines the first control point
     * @param value2 defines the second control point
     * @param value3 defines the third control point
     * @param value4 defines the fourth control point
     * @param amount defines the amount on the spline to use
     * @returns the new Vector3
     */
    public static CatmullRom(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>, value3: DeepImmutable<Vector3>, value4: DeepImmutable<Vector3>, amount: number): Vector3 {
        var squared = amount * amount;
        var cubed = amount * squared;

        var x = 0.5 * ((((2.0 * value2._x) + ((-value1._x + value3._x) * amount)) +
            (((((2.0 * value1._x) - (5.0 * value2._x)) + (4.0 * value3._x)) - value4._x) * squared)) +
            ((((-value1._x + (3.0 * value2._x)) - (3.0 * value3._x)) + value4._x) * cubed));

        var y = 0.5 * ((((2.0 * value2._y) + ((-value1._y + value3._y) * amount)) +
            (((((2.0 * value1._y) - (5.0 * value2._y)) + (4.0 * value3._y)) - value4._y) * squared)) +
            ((((-value1._y + (3.0 * value2._y)) - (3.0 * value3._y)) + value4._y) * cubed));

        var z = 0.5 * ((((2.0 * value2._z) + ((-value1._z + value3._z) * amount)) +
            (((((2.0 * value1._z) - (5.0 * value2._z)) + (4.0 * value3._z)) - value4._z) * squared)) +
            ((((-value1._z + (3.0 * value2._z)) - (3.0 * value3._z)) + value4._z) * cubed));

        return new Vector3(x, y, z);
    }

    /**
     * Returns a new Vector3 set with the coordinates of "value", if the vector "value" is in the cube defined by the vectors "min" and "max"
     * If a coordinate value of "value" is lower than one of the "min" coordinate, then this "value" coordinate is set with the "min" one
     * If a coordinate value of "value" is greater than one of the "max" coordinate, then this "value" coordinate is set with the "max" one
     * @param value defines the current value
     * @param min defines the lower range value
     * @param max defines the upper range value
     * @returns the new Vector3
     */
    public static Clamp(value: DeepImmutable<Vector3>, min: DeepImmutable<Vector3>, max: DeepImmutable<Vector3>): Vector3 {
        const v = new Vector3();
        Vector3.ClampToRef(value, min, max, v);
        return v;
    }
    /**
     * Sets the given vector "result" with the coordinates of "value", if the vector "value" is in the cube defined by the vectors "min" and "max"
     * If a coordinate value of "value" is lower than one of the "min" coordinate, then this "value" coordinate is set with the "min" one
     * If a coordinate value of "value" is greater than one of the "max" coordinate, then this "value" coordinate is set with the "max" one
     * @param value defines the current value
     * @param min defines the lower range value
     * @param max defines the upper range value
     * @param result defines the Vector3 where to store the result
     */
    public static ClampToRef(value: DeepImmutable<Vector3>, min: DeepImmutable<Vector3>, max: DeepImmutable<Vector3>, result: Vector3): void {
        var x = value._x;
        x = (x > max._x) ? max._x : x;
        x = (x < min._x) ? min._x : x;

        var y = value._y;
        y = (y > max._y) ? max._y : y;
        y = (y < min._y) ? min._y : y;

        var z = value._z;
        z = (z > max._z) ? max._z : z;
        z = (z < min._z) ? min._z : z;

        result.copyFromFloats(x, y, z);
    }

    /**
     * Checks if a given vector is inside a specific range
     * @param v defines the vector to test
     * @param min defines the minimum range
     * @param max defines the maximum range
     */
    public static CheckExtends(v: Vector3, min: Vector3, max: Vector3): void {
        min.minimizeInPlace(v);
        max.maximizeInPlace(v);
    }

    /**
     * Returns a new Vector3 located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2"
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent vector
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent vector
     * @param amount defines the amount on the interpolation spline (between 0 and 1)
     * @returns the new Vector3
     */
    public static Hermite(value1: DeepImmutable<Vector3>, tangent1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>, tangent2: DeepImmutable<Vector3>, amount: number): Vector3 {
        var squared = amount * amount;
        var cubed = amount * squared;
        var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
        var part2 = (-2.0 * cubed) + (3.0 * squared);
        var part3 = (cubed - (2.0 * squared)) + amount;
        var part4 = cubed - squared;

        var x = (((value1._x * part1) + (value2._x * part2)) + (tangent1._x * part3)) + (tangent2._x * part4);
        var y = (((value1._y * part1) + (value2._y * part2)) + (tangent1._y * part3)) + (tangent2._y * part4);
        var z = (((value1._z * part1) + (value2._z * part2)) + (tangent1._z * part3)) + (tangent2._z * part4);
        return new Vector3(x, y, z);
    }

    /**
     * Returns a new Vector3 which is the 1st derivative of the Hermite spline defined by the vectors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
    public static Hermite1stDerivative(value1: DeepImmutable<Vector3>, tangent1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>, tangent2: DeepImmutable<Vector3>, time: number): Vector3 {
        let result = Vector3.Zero();

        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);

        return result;
    }

    /**
     * Update a Vector3 with the 1st derivative of the Hermite spline defined by the vectors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where to store the derivative
     */
     public static Hermite1stDerivativeToRef(value1: DeepImmutable<Vector3>, tangent1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>, tangent2: DeepImmutable<Vector3>, time: number, result: Vector3) {
        const t2 = time * time;

        result.x = (t2 - time) * 6 * value1.x + (3 * t2 - 4 * time + 1) * tangent1.x + (-t2 + time) * 6 * value2.x + (3 * t2 - 2 * time) * tangent2.x;
        result.y = (t2 - time) * 6 * value1.y + (3 * t2 - 4 * time + 1) * tangent1.y + (-t2 + time) * 6 * value2.y + (3 * t2 - 2 * time) * tangent2.y;
        result.z = (t2 - time) * 6 * value1.z + (3 * t2 - 4 * time + 1) * tangent1.z + (-t2 + time) * 6 * value2.z + (3 * t2 - 2 * time) * tangent2.z;
    }

    /**
     * Returns a new Vector3 located for "amount" (float) on the linear interpolation between the vectors "start" and "end"
     * @param start defines the start value
     * @param end defines the end value
     * @param amount max defines amount between both (between 0 and 1)
     * @returns the new Vector3
     */
    public static Lerp(start: DeepImmutable<Vector3>, end: DeepImmutable<Vector3>, amount: number): Vector3 {
        var result = new Vector3(0, 0, 0);
        Vector3.LerpToRef(start, end, amount, result);
        return result;
    }

    /**
     * Sets the given vector "result" with the result of the linear interpolation from the vector "start" for "amount" to the vector "end"
     * @param start defines the start value
     * @param end defines the end value
     * @param amount max defines amount between both (between 0 and 1)
     * @param result defines the Vector3 where to store the result
     */
    public static LerpToRef(start: DeepImmutable<Vector3>, end: DeepImmutable<Vector3>, amount: number, result: Vector3): void {
        result.x = start._x + ((end._x - start._x) * amount);
        result.y = start._y + ((end._y - start._y) * amount);
        result.z = start._z + ((end._z - start._z) * amount);
    }

    /**
     * Returns the dot product (float) between the vectors "left" and "right"
     * @param left defines the left operand
     * @param right defines the right operand
     * @returns the dot product
     */
    public static Dot(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>): number {
        return (left._x * right._x + left._y * right._y + left._z * right._z);
    }

    /**
     * Returns a new Vector3 as the cross product of the vectors "left" and "right"
     * The cross product is then orthogonal to both "left" and "right"
     * @param left defines the left operand
     * @param right defines the right operand
     * @returns the cross product
     */
    public static Cross(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>): Vector3 {
        var result = Vector3.Zero();
        Vector3.CrossToRef(left, right, result);
        return result;
    }

    /**
     * Sets the given vector "result" with the cross product of "left" and "right"
     * The cross product is then orthogonal to both "left" and "right"
     * @param left defines the left operand
     * @param right defines the right operand
     * @param result defines the Vector3 where to store the result
     */
    public static CrossToRef(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>, result: Vector3): void {
        const x = left._y * right._z - left._z * right._y;
        const y = left._z * right._x - left._x * right._z;
        const z = left._x * right._y - left._y * right._x;
        result.copyFromFloats(x, y, z);
    }

    /**
     * Returns a new Vector3 as the normalization of the given vector
     * @param vector defines the Vector3 to normalize
     * @returns the new Vector3
     */
    public static Normalize(vector: DeepImmutable<Vector3>): Vector3 {
        var result = Vector3.Zero();
        Vector3.NormalizeToRef(vector, result);
        return result;
    }

    /**
     * Sets the given vector "result" with the normalization of the given first vector
     * @param vector defines the Vector3 to normalize
     * @param result defines the Vector3 where to store the result
     */
    public static NormalizeToRef(vector: DeepImmutable<Vector3>, result: Vector3): void {
        vector.normalizeToRef(result);
    }

    /**
     * Project a Vector3 onto screen space
     * @param vector defines the Vector3 to project
     * @param world defines the world matrix to use
     * @param transform defines the transform (view x projection) matrix to use
     * @param viewport defines the screen viewport to use
     * @returns the new Vector3
     */
    public static Project(vector: DeepImmutable<Vector3>, world: DeepImmutable<Matrix>, transform: DeepImmutable<Matrix>, viewport: DeepImmutable<Viewport>): Vector3 {
        const result = new Vector3();
        Vector3.ProjectToRef(vector, world, transform, viewport, result);
        return result;
    }

    /**
     * Project a Vector3 onto screen space to reference
     * @param vector defines the Vector3 to project
     * @param world defines the world matrix to use
     * @param transform defines the transform (view x projection) matrix to use
     * @param viewport defines the screen viewport to use
     * @param result the vector in which the screen space will be stored
     * @returns the new Vector3
     */
    public static ProjectToRef(vector: DeepImmutable<Vector3>, world: DeepImmutable<Matrix>, transform: DeepImmutable<Matrix>, viewport: DeepImmutable<Viewport>, result: DeepImmutable<Vector3>): Vector3 {
        var cw = viewport.width;
        var ch = viewport.height;
        var cx = viewport.x;
        var cy = viewport.y;

        var viewportMatrix = MathTmp.Matrix[1];

        Matrix.FromValuesToRef(
            cw / 2.0, 0, 0, 0,
            0, -ch / 2.0, 0, 0,
            0, 0, 0.5, 0,
            cx + cw / 2.0, ch / 2.0 + cy, 0.5, 1, viewportMatrix);

        var matrix = MathTmp.Matrix[0];
        world.multiplyToRef(transform, matrix);
        matrix.multiplyToRef(viewportMatrix, matrix);

        Vector3.TransformCoordinatesToRef(vector, matrix, result);
        return result;
    }

    /** @hidden */
    public static _UnprojectFromInvertedMatrixToRef(source: DeepImmutable<Vector3>, matrix: DeepImmutable<Matrix>, result: Vector3) {
        Vector3.TransformCoordinatesToRef(source, matrix, result);
        const m = matrix.m;
        var num = source._x * m[3] + source._y * m[7] + source._z * m[11] + m[15];
        if (Scalar.WithinEpsilon(num, 1.0)) {
            result.scaleInPlace(1.0 / num);
        }
    }

    /**
     * Unproject from screen space to object space
     * @param source defines the screen space Vector3 to use
     * @param viewportWidth defines the current width of the viewport
     * @param viewportHeight defines the current height of the viewport
     * @param world defines the world matrix to use (can be set to Identity to go to world space)
     * @param transform defines the transform (view x projection) matrix to use
     * @returns the new Vector3
     */
    public static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: DeepImmutable<Matrix>, transform: DeepImmutable<Matrix>): Vector3 {
        var matrix = MathTmp.Matrix[0];
        world.multiplyToRef(transform, matrix);
        matrix.invert();
        source.x = source._x / viewportWidth * 2 - 1;
        source.y = -(source._y / viewportHeight * 2 - 1);
        const vector = new Vector3();
        Vector3._UnprojectFromInvertedMatrixToRef(source, matrix, vector);
        return vector;
    }

    /**
     * Unproject from screen space to object space
     * @param source defines the screen space Vector3 to use
     * @param viewportWidth defines the current width of the viewport
     * @param viewportHeight defines the current height of the viewport
     * @param world defines the world matrix to use (can be set to Identity to go to world space)
     * @param view defines the view matrix to use
     * @param projection defines the projection matrix to use
     * @returns the new Vector3
     */
    public static Unproject(source: DeepImmutable<Vector3>, viewportWidth: number, viewportHeight: number, world: DeepImmutable<Matrix>, view: DeepImmutable<Matrix>, projection: DeepImmutable<Matrix>): Vector3 {
        let result = Vector3.Zero();

        Vector3.UnprojectToRef(source, viewportWidth, viewportHeight, world, view, projection, result);

        return result;
    }

    /**
     * Unproject from screen space to object space
     * @param source defines the screen space Vector3 to use
     * @param viewportWidth defines the current width of the viewport
     * @param viewportHeight defines the current height of the viewport
     * @param world defines the world matrix to use (can be set to Identity to go to world space)
     * @param view defines the view matrix to use
     * @param projection defines the projection matrix to use
     * @param result defines the Vector3 where to store the result
     */
    public static UnprojectToRef(source: DeepImmutable<Vector3>, viewportWidth: number, viewportHeight: number, world: DeepImmutable<Matrix>, view: DeepImmutable<Matrix>, projection: DeepImmutable<Matrix>, result: Vector3): void {
        Vector3.UnprojectFloatsToRef(source._x, source._y, source._z, viewportWidth, viewportHeight, world, view, projection, result);
    }

    /**
     * Unproject from screen space to object space
     * @param sourceX defines the screen space x coordinate to use
     * @param sourceY defines the screen space y coordinate to use
     * @param sourceZ defines the screen space z coordinate to use
     * @param viewportWidth defines the current width of the viewport
     * @param viewportHeight defines the current height of the viewport
     * @param world defines the world matrix to use (can be set to Identity to go to world space)
     * @param view defines the view matrix to use
     * @param projection defines the projection matrix to use
     * @param result defines the Vector3 where to store the result
     */
    public static UnprojectFloatsToRef(sourceX: float, sourceY: float, sourceZ: float, viewportWidth: number, viewportHeight: number, world: DeepImmutable<Matrix>, view: DeepImmutable<Matrix>, projection: DeepImmutable<Matrix>, result: Vector3): void {
        var matrix = MathTmp.Matrix[0];
        world.multiplyToRef(view, matrix);
        matrix.multiplyToRef(projection, matrix);
        matrix.invert();
        var screenSource = MathTmp.Vector3[0];
        screenSource.x = sourceX / viewportWidth * 2 - 1;
        screenSource.y = -(sourceY / viewportHeight * 2 - 1);
        screenSource.z = 2 * sourceZ - 1.0;
        Vector3._UnprojectFromInvertedMatrixToRef(screenSource, matrix, result);
    }

    /**
     * Gets the minimal coordinate values between two Vector3
     * @param left defines the first operand
     * @param right defines the second operand
     * @returns the new Vector3
     */
    public static Minimize(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>): Vector3 {
        var min = left.clone();
        min.minimizeInPlace(right);
        return min;
    }

    /**
     * Gets the maximal coordinate values between two Vector3
     * @param left defines the first operand
     * @param right defines the second operand
     * @returns the new Vector3
     */
    public static Maximize(left: DeepImmutable<Vector3>, right: DeepImmutable<Vector3>): Vector3 {
        var max = left.clone();
        max.maximizeInPlace(right);
        return max;
    }

    /**
     * Returns the distance between the vectors "value1" and "value2"
     * @param value1 defines the first operand
     * @param value2 defines the second operand
     * @returns the distance
     */
    public static Distance(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>): number {
        return Math.sqrt(Vector3.DistanceSquared(value1, value2));
    }

    /**
     * Returns the squared distance between the vectors "value1" and "value2"
     * @param value1 defines the first operand
     * @param value2 defines the second operand
     * @returns the squared distance
     */
    public static DistanceSquared(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>): number {
        var x = value1._x - value2._x;
        var y = value1._y - value2._y;
        var z = value1._z - value2._z;

        return (x * x) + (y * y) + (z * z);
    }

    /**
     * Projects "vector" on the triangle determined by its extremities "p0", "p1" and "p2", stores the result in "ref"
     * and returns the distance to the projected point.
     * From http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.104.4264&rep=rep1&type=pdf
     *
     * @param vector the vector to get distance from
     * @param p0 extremity of the triangle
     * @param p1 extremity of the triangle
     * @param p2 extremity of the triangle
     * @param ref variable to store the result to
     * @returns The distance between "ref" and "vector"
     */
    public static ProjectOnTriangleToRef(vector: DeepImmutable<Vector3>, p0: DeepImmutable<Vector3>, p1: DeepImmutable<Vector3>, p2: DeepImmutable<Vector3>, ref: Vector3) : number {
        const p1p0 = MathTmp.Vector3[0];
        const p2p0 = MathTmp.Vector3[1];
        const p2p1 = MathTmp.Vector3[2];
        const normal = MathTmp.Vector3[3];
        const vectorp0 = MathTmp.Vector3[4];

        // Triangle vectors
        p1.subtractToRef(p0, p1p0);
        p2.subtractToRef(p0, p2p0);
        p2.subtractToRef(p1, p2p1);

        const p1p0L = Math.max(p1p0.length(), Epsilon);
        const p2p0L = Math.max(p2p0.length(), Epsilon);
        const p2p1L = Math.max(p2p1.length(), Epsilon);

        // Compute normal and vector to p0
        vector.subtractToRef(p0, vectorp0);
        Vector3.CrossToRef(p1p0, p2p0, normal);
        normal.normalize();
        let l = vectorp0.length();
        vectorp0.normalizeFromLength(l);

        // Project to "proj" that lies on the triangle plane
        const cosA = Vector3.Dot(normal, vectorp0);
        const projVector = MathTmp.Vector3[5];
        const proj = MathTmp.Vector3[6];
        projVector.copyFrom(normal).scaleInPlace(- l * cosA);
        proj.copyFrom(vector).addInPlace(projVector);

        // Compute barycentric coordinates (v0, v1 and v2 are axis from barycenter to extremities)
        const v0 = MathTmp.Vector3[4];
        const v1 = MathTmp.Vector3[5];
        const v2 = MathTmp.Vector3[7];
        const tmp = MathTmp.Vector3[8];

        v0.copyFrom(p1p0).scaleInPlace(1 / p1p0L);
        tmp.copyFrom(p2p0).scaleInPlace(1 / p2p0L);
        v0.addInPlace(tmp).scaleInPlace(-1);

        v1.copyFrom(p1p0).scaleInPlace(- 1 / p1p0L);
        tmp.copyFrom(p2p1).scaleInPlace(1 / p2p1L);
        v1.addInPlace(tmp).scaleInPlace(-1);

        v2.copyFrom(p2p1).scaleInPlace(- 1 / p2p1L);
        tmp.copyFrom(p2p0).scaleInPlace(- 1 / p2p0L);
        v2.addInPlace(tmp).scaleInPlace(-1);

        // Determines which edge of the triangle is closest to "proj"
        const projP = MathTmp.Vector3[9];
        let dot;
        let s0, s1, s2;
        projP.copyFrom(proj).subtractInPlace(p0);
        Vector3.CrossToRef(v0, projP, tmp);
        dot = Vector3.Dot(tmp, normal);
        s0 = dot;

        projP.copyFrom(proj).subtractInPlace(p1);
        Vector3.CrossToRef(v1, projP, tmp);
        dot = Vector3.Dot(tmp, normal);
        s1 = dot;

        projP.copyFrom(proj).subtractInPlace(p2);
        Vector3.CrossToRef(v2, projP, tmp);
        dot = Vector3.Dot(tmp, normal);
        s2 = dot;

        const edge = MathTmp.Vector3[10];
        let e0, e1;
        if (s0 > 0 && s1 < 0) {
            edge.copyFrom(p1p0);
            e0 = p0;
            e1 = p1;
        } else if (s1 > 0 && s2 < 0) {
            edge.copyFrom(p2p1);
            e0 = p1;
            e1 = p2;
        } else {
            edge.copyFrom(p2p0).scaleInPlace(-1);
            e0 = p2;
            e1 = p0;
        }

        // Determines if "proj" lies inside the triangle
        const tmp2 = MathTmp.Vector3[9];
        const tmp3 = MathTmp.Vector3[4];
        e0.subtractToRef(proj, tmp);
        e1.subtractToRef(proj, tmp2);
        Vector3.CrossToRef(tmp, tmp2, tmp3);
        const isOutside = Vector3.Dot(tmp3, normal) < 0;

        // If inside, we already found the projected point, "proj"
        if (!isOutside) {
            ref.copyFrom(proj);
            return Math.abs(l * cosA);
        }

        // If outside, we find "triProj", the closest point from "proj" on the closest edge
        const r = MathTmp.Vector3[5];
        Vector3.CrossToRef(edge, tmp3, r);
        r.normalize();
        const e0proj = MathTmp.Vector3[9];
        e0proj.copyFrom(e0).subtractInPlace(proj);
        const e0projL = e0proj.length();
        e0proj.normalizeFromLength(e0projL);
        const cosG = Vector3.Dot(r, e0proj);
        const triProj = MathTmp.Vector3[7];
        triProj.copyFrom(proj).addInPlace(r.scaleInPlace(e0projL * cosG));

        // Now we clamp "triProj" so it lies between e0 and e1
        tmp.copyFrom(triProj).subtractInPlace(e0);
        l = edge.length();
        edge.normalizeFromLength(l);
        let t = Vector3.Dot(tmp, edge) / Math.max(l, Epsilon);
        t = Scalar.Clamp(t, 0, 1);
        triProj.copyFrom(e0).addInPlace(edge.scaleInPlace(t * l));
        ref.copyFrom(triProj);

        return Vector3.Distance(vector, triProj);
    }

    /**
     * Returns a new Vector3 located at the center between "value1" and "value2"
     * @param value1 defines the first operand
     * @param value2 defines the second operand
     * @returns the new Vector3
     */
    public static Center(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>): Vector3 {
        return Vector3.CenterToRef(value1, value2, Vector3.Zero());
    }

    /**
     * Gets the center of the vectors "value1" and "value2" and stores the result in the vector "ref"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @param ref defines third vector
     * @returns ref
     */
    public static CenterToRef(value1: DeepImmutable<Vector3>, value2: DeepImmutable<Vector3>, ref: DeepImmutable<Vector3>): Vector3 {
        return ref.copyFromFloats((value1._x + value2._x) / 2, (value1._y + value2._y) / 2, (value1._z + value2._z) / 2);
    }

    /**
     * Given three orthogonal normalized left-handed oriented Vector3 axis in space (target system),
     * RotationFromAxis() returns the rotation Euler angles (ex : rotation.x, rotation.y, rotation.z) to apply
     * to something in order to rotate it from its local system to the given target system
     * Note: axis1, axis2 and axis3 are normalized during this operation
     * @param axis1 defines the first axis
     * @param axis2 defines the second axis
     * @param axis3 defines the third axis
     * @returns a new Vector3
     */
    public static RotationFromAxis(axis1: DeepImmutable<Vector3>, axis2: DeepImmutable<Vector3>, axis3: DeepImmutable<Vector3>): Vector3 {
        var rotation = Vector3.Zero();
        Vector3.RotationFromAxisToRef(axis1, axis2, axis3, rotation);
        return rotation;
    }

    /**
     * The same than RotationFromAxis but updates the given ref Vector3 parameter instead of returning a new Vector3
     * @param axis1 defines the first axis
     * @param axis2 defines the second axis
     * @param axis3 defines the third axis
     * @param ref defines the Vector3 where to store the result
     */
    public static RotationFromAxisToRef(axis1: DeepImmutable<Vector3>, axis2: DeepImmutable<Vector3>, axis3: DeepImmutable<Vector3>, ref: Vector3): void {
        var quat = MathTmp.Quaternion[0];
        Quaternion.RotationQuaternionFromAxisToRef(axis1, axis2, axis3, quat);
        quat.toEulerAnglesToRef(ref);
    }
}

/**
 * Vector4 class created for EulerAngle class conversion to Quaternion
 */
export class Vector4 {
    /**
     * Creates a Vector4 object from the given floats.
     * @param x x value of the vector
     * @param y y value of the vector
     * @param z z value of the vector
     * @param w w value of the vector
     */
    constructor(
        /** x value of the vector */
        public x: number,
        /** y value of the vector */
        public y: number,
        /** z value of the vector */
        public z: number,
        /** w value of the vector */
        public w: number
    ) { }

    /**
     * Returns the string with the Vector4 coordinates.
     * @returns a string containing all the vector values
     */
    public toString(): string {
        return `{X: ${this.x} Y: ${this.y} Z: ${this.z} W: ${this.w}}`;
    }

    /**
     * Returns the string "Vector4".
     * @returns "Vector4"
     */
    public getClassName(): string {
        return "Vector4";
    }

    /**
     * Returns the Vector4 hash code.
     * @returns a unique hash code
     */
    public getHashCode(): number {
        let hash = this.x | 0;
        hash = (hash * 397) ^ (this.y | 0);
        hash = (hash * 397) ^ (this.z | 0);
        hash = (hash * 397) ^ (this.w | 0);
        return hash;
    }

    // Operators
    /**
     * Returns a new array populated with 4 elements : the Vector4 coordinates.
     * @returns the resulting array
     */
    public asArray(): number[] {
        var result = new Array<number>();

        this.toArray(result, 0);

        return result;
    }

    /**
     * Populates the given array from the given index with the Vector4 coordinates.
     * @param array array to populate
     * @param index index of the array to start at (default: 0)
     * @returns the Vector4.
     */
    public toArray(array: FloatArray, index?: number): Vector4 {
        if (index === undefined) {
            index = 0;
        }
        array[index] = this.x;
        array[index + 1] = this.y;
        array[index + 2] = this.z;
        array[index + 3] = this.w;
        return this;
    }

    /**
     * Update the current vector from an array
     * @param array defines the destination array
     * @param index defines the offset in the destination array
     * @returns the current Vector3
     */
    public fromArray(array: FloatArray, index: number = 0): Vector4 {
        Vector4.FromArrayToRef(array, index, this);
        return this;
    }

    /**
     * Adds the given vector to the current Vector4.
     * @param otherVector the vector to add
     * @returns the updated Vector4.
     */
    public addInPlace(otherVector: DeepImmutable<Vector4>): Vector4 {
        this.x += otherVector.x;
        this.y += otherVector.y;
        this.z += otherVector.z;
        this.w += otherVector.w;
        return this;
    }

    /**
     * Returns a new Vector4 as the result of the addition of the current Vector4 and the given one.
     * @param otherVector the vector to add
     * @returns the resulting vector
     */
    public add(otherVector: DeepImmutable<Vector4>): Vector4 {
        return new Vector4(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z, this.w + otherVector.w);
    }

    /**
     * Updates the given vector "result" with the result of the addition of the current Vector4 and the given one.
     * @param otherVector the vector to add
     * @param result the vector to store the result
     * @returns the current Vector4.
     */
    public addToRef(otherVector: DeepImmutable<Vector4>, result: Vector4): Vector4 {
        result.x = this.x + otherVector.x;
        result.y = this.y + otherVector.y;
        result.z = this.z + otherVector.z;
        result.w = this.w + otherVector.w;
        return this;
    }

    /**
     * Subtract in place the given vector from the current Vector4.
     * @param otherVector the vector to subtract
     * @returns the updated Vector4.
     */
    public subtractInPlace(otherVector: DeepImmutable<Vector4>): Vector4 {
        this.x -= otherVector.x;
        this.y -= otherVector.y;
        this.z -= otherVector.z;
        this.w -= otherVector.w;
        return this;
    }

    /**
     * Returns a new Vector4 with the result of the subtraction of the given vector from the current Vector4.
     * @param otherVector the vector to add
     * @returns the new vector with the result
     */
    public subtract(otherVector: DeepImmutable<Vector4>): Vector4 {
        return new Vector4(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z, this.w - otherVector.w);
    }

    /**
     * Sets the given vector "result" with the result of the subtraction of the given vector from the current Vector4.
     * @param otherVector the vector to subtract
     * @param result the vector to store the result
     * @returns the current Vector4.
     */
    public subtractToRef(otherVector: DeepImmutable<Vector4>, result: Vector4): Vector4 {
        result.x = this.x - otherVector.x;
        result.y = this.y - otherVector.y;
        result.z = this.z - otherVector.z;
        result.w = this.w - otherVector.w;
        return this;
    }

    /**
     * Returns a new Vector4 set with the result of the subtraction of the given floats from the current Vector4 coordinates.
     */
    /**
     * Returns a new Vector4 set with the result of the subtraction of the given floats from the current Vector4 coordinates.
     * @param x value to subtract
     * @param y value to subtract
     * @param z value to subtract
     * @param w value to subtract
     * @returns new vector containing the result
     */
    public subtractFromFloats(x: number, y: number, z: number, w: number): Vector4 {
        return new Vector4(this.x - x, this.y - y, this.z - z, this.w - w);
    }

    /**
     * Sets the given vector "result" set with the result of the subtraction of the given floats from the current Vector4 coordinates.
     * @param x value to subtract
     * @param y value to subtract
     * @param z value to subtract
     * @param w value to subtract
     * @param result the vector to store the result in
     * @returns the current Vector4.
     */
    public subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): Vector4 {
        result.x = this.x - x;
        result.y = this.y - y;
        result.z = this.z - z;
        result.w = this.w - w;
        return this;
    }

    /**
     * Returns a new Vector4 set with the current Vector4 negated coordinates.
     * @returns a new vector with the negated values
     */
    public negate(): Vector4 {
        return new Vector4(-this.x, -this.y, -this.z, -this.w);
    }

    /**
     * Negate this vector in place
     * @returns this
     */
    public negateInPlace(): Vector4 {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        this.w *= -1;
        return this;
    }

    /**
     * Negate the current Vector4 and stores the result in the given vector "result" coordinates
     * @param result defines the Vector3 object where to store the result
     * @returns the current Vector4
     */
    public negateToRef(result: Vector4): Vector4 {
        return result.copyFromFloats(this.x * -1, this.y * -1, this.z * -1, this.w * -1);
    }

    /**
     * Multiplies the current Vector4 coordinates by scale (float).
     * @param scale the number to scale with
     * @returns the updated Vector4.
     */
    public scaleInPlace(scale: number): Vector4 {
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
        this.w *= scale;
        return this;
    }

    /**
     * Returns a new Vector4 set with the current Vector4 coordinates multiplied by scale (float).
     * @param scale the number to scale with
     * @returns a new vector with the result
     */
    public scale(scale: number): Vector4 {
        return new Vector4(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
    }

    /**
     * Sets the given vector "result" with the current Vector4 coordinates multiplied by scale (float).
     * @param scale the number to scale with
     * @param result a vector to store the result in
     * @returns the current Vector4.
     */
    public scaleToRef(scale: number, result: Vector4): Vector4 {
        result.x = this.x * scale;
        result.y = this.y * scale;
        result.z = this.z * scale;
        result.w = this.w * scale;
        return this;
    }

    /**
     * Scale the current Vector4 values by a factor and add the result to a given Vector4
     * @param scale defines the scale factor
     * @param result defines the Vector4 object where to store the result
     * @returns the unmodified current Vector4
     */
    public scaleAndAddToRef(scale: number, result: Vector4): Vector4 {
        result.x += this.x * scale;
        result.y += this.y * scale;
        result.z += this.z * scale;
        result.w += this.w * scale;
        return this;
    }

    /**
     * Boolean : True if the current Vector4 coordinates are stricly equal to the given ones.
     * @param otherVector the vector to compare against
     * @returns true if they are equal
     */
    public equals(otherVector: DeepImmutable<Vector4>): boolean {
        return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z && this.w === otherVector.w;
    }

    /**
     * Boolean : True if the current Vector4 coordinates are each beneath the distance "epsilon" from the given vector ones.
     * @param otherVector vector to compare against
     * @param epsilon (Default: very small number)
     * @returns true if they are equal
     */
    public equalsWithEpsilon(otherVector: DeepImmutable<Vector4>, epsilon: number = Epsilon): boolean {
        return otherVector
            && Scalar.WithinEpsilon(this.x, otherVector.x, epsilon)
            && Scalar.WithinEpsilon(this.y, otherVector.y, epsilon)
            && Scalar.WithinEpsilon(this.z, otherVector.z, epsilon)
            && Scalar.WithinEpsilon(this.w, otherVector.w, epsilon);
    }

    /**
     * Boolean : True if the given floats are strictly equal to the current Vector4 coordinates.
     * @param x x value to compare against
     * @param y y value to compare against
     * @param z z value to compare against
     * @param w w value to compare against
     * @returns true if equal
     */
    public equalsToFloats(x: number, y: number, z: number, w: number): boolean {
        return this.x === x && this.y === y && this.z === z && this.w === w;
    }

    /**
     * Multiplies in place the current Vector4 by the given one.
     * @param otherVector vector to multiple with
     * @returns the updated Vector4.
     */
    public multiplyInPlace(otherVector: Vector4): Vector4 {
        this.x *= otherVector.x;
        this.y *= otherVector.y;
        this.z *= otherVector.z;
        this.w *= otherVector.w;
        return this;
    }

    /**
     * Returns a new Vector4 set with the multiplication result of the current Vector4 and the given one.
     * @param otherVector vector to multiple with
     * @returns resulting new vector
     */
    public multiply(otherVector: DeepImmutable<Vector4>): Vector4 {
        return new Vector4(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z, this.w * otherVector.w);
    }
    /**
     * Updates the given vector "result" with the multiplication result of the current Vector4 and the given one.
     * @param otherVector vector to multiple with
     * @param result vector to store the result
     * @returns the current Vector4.
     */
    public multiplyToRef(otherVector: DeepImmutable<Vector4>, result: Vector4): Vector4 {
        result.x = this.x * otherVector.x;
        result.y = this.y * otherVector.y;
        result.z = this.z * otherVector.z;
        result.w = this.w * otherVector.w;
        return this;
    }
    /**
     * Returns a new Vector4 set with the multiplication result of the given floats and the current Vector4 coordinates.
     * @param x x value multiply with
     * @param y y value multiply with
     * @param z z value multiply with
     * @param w w value multiply with
     * @returns resulting new vector
     */
    public multiplyByFloats(x: number, y: number, z: number, w: number): Vector4 {
        return new Vector4(this.x * x, this.y * y, this.z * z, this.w * w);
    }
    /**
     * Returns a new Vector4 set with the division result of the current Vector4 by the given one.
     * @param otherVector vector to devide with
     * @returns resulting new vector
     */
    public divide(otherVector: DeepImmutable<Vector4>): Vector4 {
        return new Vector4(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z, this.w / otherVector.w);
    }
    /**
     * Updates the given vector "result" with the division result of the current Vector4 by the given one.
     * @param otherVector vector to devide with
     * @param result vector to store the result
     * @returns the current Vector4.
     */
    public divideToRef(otherVector: DeepImmutable<Vector4>, result: Vector4): Vector4 {
        result.x = this.x / otherVector.x;
        result.y = this.y / otherVector.y;
        result.z = this.z / otherVector.z;
        result.w = this.w / otherVector.w;
        return this;
    }

    /**
     * Divides the current Vector3 coordinates by the given ones.
     * @param otherVector vector to devide with
     * @returns the updated Vector3.
     */
    public divideInPlace(otherVector: DeepImmutable<Vector4>): Vector4 {
        return this.divideToRef(otherVector, this);
    }

    /**
     * Updates the Vector4 coordinates with the minimum values between its own and the given vector ones
     * @param other defines the second operand
     * @returns the current updated Vector4
     */
    public minimizeInPlace(other: DeepImmutable<Vector4>): Vector4 {
        if (other.x < this.x) { this.x = other.x; }
        if (other.y < this.y) { this.y = other.y; }
        if (other.z < this.z) { this.z = other.z; }
        if (other.w < this.w) { this.w = other.w; }
        return this;
    }
    /**
     * Updates the Vector4 coordinates with the maximum values between its own and the given vector ones
     * @param other defines the second operand
     * @returns the current updated Vector4
     */
    public maximizeInPlace(other: DeepImmutable<Vector4>): Vector4 {
        if (other.x > this.x) { this.x = other.x; }
        if (other.y > this.y) { this.y = other.y; }
        if (other.z > this.z) { this.z = other.z; }
        if (other.w > this.w) { this.w = other.w; }
        return this;
    }

    /**
     * Gets a new Vector4 from current Vector4 floored values
     * @returns a new Vector4
     */
    public floor(): Vector4 {
        return new Vector4(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z), Math.floor(this.w));
    }

    /**
     * Gets a new Vector4 from current Vector3 floored values
     * @returns a new Vector4
     */
    public fract(): Vector4 {
        return new Vector4(this.x - Math.floor(this.x), this.y - Math.floor(this.y), this.z - Math.floor(this.z), this.w - Math.floor(this.w));
    }

    // Properties
    /**
     * Returns the Vector4 length (float).
     * @returns the length
     */
    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    /**
     * Returns the Vector4 squared length (float).
     * @returns the length squared
     */
    public lengthSquared(): number {
        return (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    // Methods
    /**
     * Normalizes in place the Vector4.
     * @returns the updated Vector4.
     */
    public normalize(): Vector4 {
        var len = this.length();

        if (len === 0) {
            return this;
        }

        return this.scaleInPlace(1.0 / len);
    }

    /**
     * Returns a new Vector3 from the Vector4 (x, y, z) coordinates.
     * @returns this converted to a new vector3
     */
    public toVector3(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }
    /**
     * Returns a new Vector4 copied from the current one.
     * @returns the new cloned vector
     */
    public clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }
    /**
     * Updates the current Vector4 with the given one coordinates.
     * @param source the source vector to copy from
     * @returns the updated Vector4.
     */
    public copyFrom(source: DeepImmutable<Vector4>): Vector4 {
        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
        this.w = source.w;
        return this;
    }
    /**
     * Updates the current Vector4 coordinates with the given floats.
     * @param x float to copy from
     * @param y float to copy from
     * @param z float to copy from
     * @param w float to copy from
     * @returns the updated Vector4.
     */
    public copyFromFloats(x: number, y: number, z: number, w: number): Vector4 {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }
    /**
     * Updates the current Vector4 coordinates with the given floats.
     * @param x float to set from
     * @param y float to set from
     * @param z float to set from
     * @param w float to set from
     * @returns the updated Vector4.
     */
    public set(x: number, y: number, z: number, w: number): Vector4 {
        return this.copyFromFloats(x, y, z, w);
    }

    /**
     * Copies the given float to the current Vector3 coordinates
     * @param v defines the x, y, z and w coordinates of the operand
     * @returns the current updated Vector3
     */
    public setAll(v: number): Vector4 {
        this.x = this.y = this.z = this.w = v;
        return this;
    }

    // Statics
    /**
     * Returns a new Vector4 set from the starting index of the given array.
     * @param array the array to pull values from
     * @param offset the offset into the array to start at
     * @returns the new vector
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset?: number): Vector4 {
        if (!offset) {
            offset = 0;
        }
        return new Vector4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    }
    /**
     * Updates the given vector "result" from the starting index of the given array.
     * @param array the array to pull values from
     * @param offset the offset into the array to start at
     * @param result the vector to store the result in
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number, result: Vector4): void {
        result.x = array[offset];
        result.y = array[offset + 1];
        result.z = array[offset + 2];
        result.w = array[offset + 3];
    }
    /**
     * Updates the given vector "result" from the starting index of the given Float32Array.
     * @param array the array to pull values from
     * @param offset the offset into the array to start at
     * @param result the vector to store the result in
     */
    public static FromFloatArrayToRef(array: DeepImmutable<Float32Array>, offset: number, result: Vector4): void {
        Vector4.FromArrayToRef(array, offset, result);
    }
    /**
     * Updates the given vector "result" coordinates from the given floats.
     * @param x float to set from
     * @param y float to set from
     * @param z float to set from
     * @param w float to set from
     * @param result the vector to the floats in
     */
    public static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void {
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
    }
    /**
     * Returns a new Vector4 set to (0.0, 0.0, 0.0, 0.0)
     * @returns the new vector
     */
    public static Zero(): Vector4 {
        return new Vector4(0.0, 0.0, 0.0, 0.0);
    }
    /**
     * Returns a new Vector4 set to (1.0, 1.0, 1.0, 1.0)
     * @returns the new vector
     */
    public static One(): Vector4 {
        return new Vector4(1.0, 1.0, 1.0, 1.0);
    }
    /**
     * Returns a new normalized Vector4 from the given one.
     * @param vector the vector to normalize
     * @returns the vector
     */
    public static Normalize(vector: DeepImmutable<Vector4>): Vector4 {
        var result = Vector4.Zero();
        Vector4.NormalizeToRef(vector, result);
        return result;
    }
    /**
     * Updates the given vector "result" from the normalization of the given one.
     * @param vector the vector to normalize
     * @param result the vector to store the result in
     */
    public static NormalizeToRef(vector: DeepImmutable<Vector4>, result: Vector4): void {
        result.copyFrom(vector);
        result.normalize();
    }

    /**
     * Returns a vector with the minimum values from the left and right vectors
     * @param left left vector to minimize
     * @param right right vector to minimize
     * @returns a new vector with the minimum of the left and right vector values
     */
    public static Minimize(left: DeepImmutable<Vector4>, right: DeepImmutable<Vector4>): Vector4 {
        var min = left.clone();
        min.minimizeInPlace(right);
        return min;
    }

    /**
     * Returns a vector with the maximum values from the left and right vectors
     * @param left left vector to maximize
     * @param right right vector to maximize
     * @returns a new vector with the maximum of the left and right vector values
     */
    public static Maximize(left: DeepImmutable<Vector4>, right: DeepImmutable<Vector4>): Vector4 {
        var max = left.clone();
        max.maximizeInPlace(right);
        return max;
    }
    /**
     * Returns the distance (float) between the vectors "value1" and "value2".
     * @param value1 value to calulate the distance between
     * @param value2 value to calulate the distance between
     * @return the distance between the two vectors
     */
    public static Distance(value1: DeepImmutable<Vector4>, value2: DeepImmutable<Vector4>): number {
        return Math.sqrt(Vector4.DistanceSquared(value1, value2));
    }
    /**
     * Returns the squared distance (float) between the vectors "value1" and "value2".
     * @param value1 value to calulate the distance between
     * @param value2 value to calulate the distance between
     * @return the distance between the two vectors squared
     */
    public static DistanceSquared(value1: DeepImmutable<Vector4>, value2: DeepImmutable<Vector4>): number {
        var x = value1.x - value2.x;
        var y = value1.y - value2.y;
        var z = value1.z - value2.z;
        var w = value1.w - value2.w;

        return (x * x) + (y * y) + (z * z) + (w * w);
    }
    /**
     * Returns a new Vector4 located at the center between the vectors "value1" and "value2".
     * @param value1 value to calulate the center between
     * @param value2 value to calulate the center between
     * @return the center between the two vectors
     */
    public static Center(value1: DeepImmutable<Vector4>, value2: DeepImmutable<Vector4>): Vector4 {
        return Vector4.CenterToRef(value1, value2, Vector4.Zero());
    }

    /**
     * Gets the center of the vectors "value1" and "value2" and stores the result in the vector "ref"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @param ref defines third vector
     * @returns ref
     */
    public static CenterToRef(value1: DeepImmutable<Vector4>, value2: DeepImmutable<Vector4>, ref: DeepImmutable<Vector4>): Vector4 {
        return ref.copyFromFloats((value1.x + value2.x) / 2, (value1.y + value2.y) / 2, (value1.z + value2.z) / 2, (value1.w + value2.w) / 2);
    }

    /**
     * Returns a new Vector4 set with the result of the transformation by the given matrix of the given vector.
     * This method computes tranformed coordinates only, not transformed direction vectors (ie. it takes translation in account)
     * The difference with Vector3.TransformCoordinates is that the w component is not used to divide the other coordinates but is returned in the w coordinate instead
     * @param vector defines the Vector3 to transform
     * @param transformation defines the transformation matrix
     * @returns the transformed Vector4
     */
     public static TransformCoordinates(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>): Vector4 {
        var result = Vector4.Zero();
        Vector4.TransformCoordinatesToRef(vector, transformation, result);
        return result;
    }

    /**
     * Sets the given vector "result" coordinates with the result of the transformation by the given matrix of the given vector
     * This method computes tranformed coordinates only, not transformed direction vectors (ie. it takes translation in account)
     * The difference with Vector3.TransformCoordinatesToRef is that the w component is not used to divide the other coordinates but is returned in the w coordinate instead
     * @param vector defines the Vector3 to transform
     * @param transformation defines the transformation matrix
     * @param result defines the Vector4 where to store the result
     */
    public static TransformCoordinatesToRef(vector: DeepImmutable<Vector3>, transformation: DeepImmutable<Matrix>, result: Vector4): void {
        Vector4.TransformCoordinatesFromFloatsToRef(vector._x, vector._y, vector._z, transformation, result);
    }

    /**
     * Sets the given vector "result" coordinates with the result of the transformation by the given matrix of the given floats (x, y, z)
     * This method computes tranformed coordinates only, not transformed direction vectors
     * The difference with Vector3.TransformCoordinatesFromFloatsToRef is that the w component is not used to divide the other coordinates but is returned in the w coordinate instead
     * @param x define the x coordinate of the source vector
     * @param y define the y coordinate of the source vector
     * @param z define the z coordinate of the source vector
     * @param transformation defines the transformation matrix
     * @param result defines the Vector4 where to store the result
     */
    public static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: DeepImmutable<Matrix>, result: Vector4): void {
        const m = transformation.m;
        var rx = x * m[0] + y * m[4] + z * m[8] + m[12];
        var ry = x * m[1] + y * m[5] + z * m[9] + m[13];
        var rz = x * m[2] + y * m[6] + z * m[10] + m[14];
        var rw = x * m[3] + y * m[7] + z * m[11] + m[15];

        result.x = rx;
        result.y = ry;
        result.z = rz;
        result.w = rw;
    }

    /**
     * Returns a new Vector4 set with the result of the normal transformation by the given matrix of the given vector.
     * This methods computes transformed normalized direction vectors only.
     * @param vector the vector to transform
     * @param transformation the transformation matrix to apply
     * @returns the new vector
     */
    public static TransformNormal(vector: DeepImmutable<Vector4>, transformation: DeepImmutable<Matrix>): Vector4 {
        var result = Vector4.Zero();
        Vector4.TransformNormalToRef(vector, transformation, result);
        return result;
    }

    /**
     * Sets the given vector "result" with the result of the normal transformation by the given matrix of the given vector.
     * This methods computes transformed normalized direction vectors only.
     * @param vector the vector to transform
     * @param transformation the transformation matrix to apply
     * @param result the vector to store the result in
     */
    public static TransformNormalToRef(vector: DeepImmutable<Vector4>, transformation: DeepImmutable<Matrix>, result: Vector4): void {
        const m = transformation.m;
        var x = (vector.x * m[0]) + (vector.y * m[4]) + (vector.z * m[8]);
        var y = (vector.x * m[1]) + (vector.y * m[5]) + (vector.z * m[9]);
        var z = (vector.x * m[2]) + (vector.y * m[6]) + (vector.z * m[10]);
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = vector.w;
    }

    /**
     * Sets the given vector "result" with the result of the normal transformation by the given matrix of the given floats (x, y, z, w).
     * This methods computes transformed normalized direction vectors only.
     * @param x value to transform
     * @param y value to transform
     * @param z value to transform
     * @param w value to transform
     * @param transformation the transformation matrix to apply
     * @param result the vector to store the results in
     */
    public static TransformNormalFromFloatsToRef(x: number, y: number, z: number, w: number, transformation: DeepImmutable<Matrix>, result: Vector4): void {
        const m = transformation.m;
        result.x = (x * m[0]) + (y * m[4]) + (z * m[8]);
        result.y = (x * m[1]) + (y * m[5]) + (z * m[9]);
        result.z = (x * m[2]) + (y * m[6]) + (z * m[10]);
        result.w = w;
    }

    /**
     * Creates a new Vector4 from a Vector3
     * @param source defines the source data
     * @param w defines the 4th component (default is 0)
     * @returns a new Vector4
     */
    public static FromVector3(source: Vector3, w: number = 0) {
        return new Vector4(source._x, source._y, source._z, w);
    }
}

/**
 * Class used to store quaternion data
 * @see https://en.wikipedia.org/wiki/Quaternion
 * @see https://doc.babylonjs.com/features/position,_rotation,_scaling
 */
export class Quaternion {
    /** @hidden */
    public _x: number;

    /** @hidden */
    public _y: number;

    /** @hidden */
    public _z: number;

    /** @hidden */
    public _w: number;

    /** @hidden */
    public _isDirty = true;

    /** Gets or sets the x coordinate */
    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
        this._isDirty = true;
    }

    /** Gets or sets the y coordinate */
    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
        this._isDirty = true;
    }

    /** Gets or sets the z coordinate */
    public get z() {
        return this._z;
    }

    public set z(value: number) {
        this._z = value;
        this._isDirty = true;
    }

    /** Gets or sets the w coordinate */
    public get w() {
        return this._w;
    }

    public set w(value: number) {
        this._w = value;
        this._isDirty = true;
    }
    /**
     * Creates a new Quaternion from the given floats
     * @param x defines the first component (0 by default)
     * @param y defines the second component (0 by default)
     * @param z defines the third component (0 by default)
     * @param w defines the fourth component (1.0 by default)
     */
    constructor(
        x: number = 0.0,
        y: number = 0.0,
        z: number = 0.0,
        w: number = 1.0) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;
    }

    /**
     * Gets a string representation for the current quaternion
     * @returns a string with the Quaternion coordinates
     */
    public toString(): string {
        return `{X: ${this._x} Y: ${this._y} Z: ${this._z} W: ${this._w}}`;
    }

    /**
     * Gets the class name of the quaternion
     * @returns the string "Quaternion"
     */
    public getClassName(): string {
        return "Quaternion";
    }

    /**
     * Gets a hash code for this quaternion
     * @returns the quaternion hash code
     */
    public getHashCode(): number {
        let hash = this._x | 0;
        hash = (hash * 397) ^ (this._y | 0);
        hash = (hash * 397) ^ (this._z | 0);
        hash = (hash * 397) ^ (this._w | 0);
        return hash;
    }

    /**
     * Copy the quaternion to an array
     * @returns a new array populated with 4 elements from the quaternion coordinates
     */
    public asArray(): number[] {
        return [this._x, this._y, this._z, this._w];
    }
    /**
     * Check if two quaternions are equals
     * @param otherQuaternion defines the second operand
     * @return true if the current quaternion and the given one coordinates are strictly equals
     */
    public equals(otherQuaternion: DeepImmutable<Quaternion>): boolean {
        return otherQuaternion && this._x === otherQuaternion._x && this._y === otherQuaternion._y && this._z === otherQuaternion._z && this._w === otherQuaternion._w;
    }

    /**
     * Gets a boolean if two quaternions are equals (using an epsilon value)
     * @param otherQuaternion defines the other quaternion
     * @param epsilon defines the minimal distance to consider equality
     * @returns true if the given quaternion coordinates are close to the current ones by a distance of epsilon.
     */
    public equalsWithEpsilon(otherQuaternion: DeepImmutable<Quaternion>, epsilon: number = Epsilon): boolean {
        return otherQuaternion
            && Scalar.WithinEpsilon(this._x, otherQuaternion._x, epsilon)
            && Scalar.WithinEpsilon(this._y, otherQuaternion._y, epsilon)
            && Scalar.WithinEpsilon(this._z, otherQuaternion._z, epsilon)
            && Scalar.WithinEpsilon(this._w, otherQuaternion._w, epsilon);
    }

    /**
     * Clone the current quaternion
     * @returns a new quaternion copied from the current one
     */
    public clone(): Quaternion {
        return new Quaternion(this._x, this._y, this._z, this._w);
    }

    /**
     * Copy a quaternion to the current one
     * @param other defines the other quaternion
     * @returns the updated current quaternion
     */
    public copyFrom(other: DeepImmutable<Quaternion>): Quaternion {
        this.x = other._x;
        this.y = other._y;
        this.z = other._z;
        this.w = other._w;
        return this;
    }

    /**
     * Updates the current quaternion with the given float coordinates
     * @param x defines the x coordinate
     * @param y defines the y coordinate
     * @param z defines the z coordinate
     * @param w defines the w coordinate
     * @returns the updated current quaternion
     */
    public copyFromFloats(x: number, y: number, z: number, w: number): Quaternion {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * Updates the current quaternion from the given float coordinates
     * @param x defines the x coordinate
     * @param y defines the y coordinate
     * @param z defines the z coordinate
     * @param w defines the w coordinate
     * @returns the updated current quaternion
     */
    public set(x: number, y: number, z: number, w: number): Quaternion {
        return this.copyFromFloats(x, y, z, w);
    }

    /**
     * Adds two quaternions
     * @param other defines the second operand
     * @returns a new quaternion as the addition result of the given one and the current quaternion
     */
    public add(other: DeepImmutable<Quaternion>): Quaternion {
        return new Quaternion(this._x + other._x, this._y + other._y, this._z + other._z, this._w + other._w);
    }

    /**
     * Add a quaternion to the current one
     * @param other defines the quaternion to add
     * @returns the current quaternion
     */
    public addInPlace(other: DeepImmutable<Quaternion>): Quaternion {
        this._x += other._x;
        this._y += other._y;
        this._z += other._z;
        this._w += other._w;
        return this;
    }
    /**
     * Subtract two quaternions
     * @param other defines the second operand
     * @returns a new quaternion as the subtraction result of the given one from the current one
     */
    public subtract(other: Quaternion): Quaternion {
        return new Quaternion(this._x - other._x, this._y - other._y, this._z - other._z, this._w - other._w);
    }

    /**
     * Multiplies the current quaternion by a scale factor
     * @param value defines the scale factor
     * @returns a new quaternion set by multiplying the current quaternion coordinates by the float "scale"
     */
    public scale(value: number): Quaternion {
        return new Quaternion(this._x * value, this._y * value, this._z * value, this._w * value);
    }

    /**
     * Scale the current quaternion values by a factor and stores the result to a given quaternion
     * @param scale defines the scale factor
     * @param result defines the Quaternion object where to store the result
     * @returns the unmodified current quaternion
     */
    public scaleToRef(scale: number, result: Quaternion): Quaternion {
        result.x = this._x * scale;
        result.y = this._y * scale;
        result.z = this._z * scale;
        result.w = this._w * scale;
        return this;
    }

    /**
     * Multiplies in place the current quaternion by a scale factor
     * @param value defines the scale factor
     * @returns the current modified quaternion
     */
    public scaleInPlace(value: number): Quaternion {
        this.x *= value;
        this.y *= value;
        this.z *= value;
        this.w *= value;

        return this;
    }

    /**
     * Scale the current quaternion values by a factor and add the result to a given quaternion
     * @param scale defines the scale factor
     * @param result defines the Quaternion object where to store the result
     * @returns the unmodified current quaternion
     */
    public scaleAndAddToRef(scale: number, result: Quaternion): Quaternion {
        result.x += this._x * scale;
        result.y += this._y * scale;
        result.z += this._z * scale;
        result.w += this._w * scale;
        return this;
    }

    /**
     * Multiplies two quaternions
     * @param q1 defines the second operand
     * @returns a new quaternion set as the multiplication result of the current one with the given one "q1"
     */
    public multiply(q1: DeepImmutable<Quaternion>): Quaternion {
        var result = new Quaternion(0, 0, 0, 1.0);
        this.multiplyToRef(q1, result);
        return result;
    }
    /**
     * Sets the given "result" as the the multiplication result of the current one with the given one "q1"
     * @param q1 defines the second operand
     * @param result defines the target quaternion
     * @returns the current quaternion
     */
    public multiplyToRef(q1: DeepImmutable<Quaternion>, result: Quaternion): Quaternion {
        var x = this._x * q1._w + this._y * q1._z - this._z * q1._y + this._w * q1._x;
        var y = -this._x * q1._z + this._y * q1._w + this._z * q1._x + this._w * q1._y;
        var z = this._x * q1._y - this._y * q1._x + this._z * q1._w + this._w * q1._z;
        var w = -this._x * q1._x - this._y * q1._y - this._z * q1._z + this._w * q1._w;
        result.copyFromFloats(x, y, z, w);
        return this;
    }

    /**
     * Updates the current quaternion with the multiplication of itself with the given one "q1"
     * @param q1 defines the second operand
     * @returns the currentupdated quaternion
     */
    public multiplyInPlace(q1: DeepImmutable<Quaternion>): Quaternion {
        this.multiplyToRef(q1, this);
        return this;
    }

    /**
     * Conjugates (1-q) the current quaternion and stores the result in the given quaternion
     * @param ref defines the target quaternion
     * @returns the current quaternion
     */
    public conjugateToRef(ref: Quaternion): Quaternion {
        ref.copyFromFloats(-this._x, -this._y, -this._z, this._w);
        return this;
    }

    /**
     * Conjugates in place (1-q) the current quaternion
     * @returns the current updated quaternion
     */
    public conjugateInPlace(): Quaternion {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }

    /**
     * Conjugates in place (1-q) the current quaternion
     * @returns a new quaternion
     */
    public conjugate(): Quaternion {
        var result = new Quaternion(-this._x, -this._y, -this._z, this._w);
        return result;
    }

    /**
     * Gets length of current quaternion
     * @returns the quaternion length (float)
     */
    public length(): number {
        return Math.sqrt((this._x * this._x) + (this._y * this._y) + (this._z * this._z) + (this._w * this._w));
    }

    /**
     * Normalize in place the current quaternion
     * @returns the current updated quaternion
     */
    public normalize(): Quaternion {
        var len = this.length();

        if (len === 0) {
            return this;
        }

        var inv = 1.0 / len;
        this.x *= inv;
        this.y *= inv;
        this.z *= inv;
        this.w *= inv;
        return this;
    }

    /**
     * Returns a new Vector3 set with the Euler angles translated from the current quaternion
     * @param order is a reserved parameter and is ignored for now
     * @returns a new Vector3 containing the Euler angles
     */
    public toEulerAngles(order = "YZX"): Vector3 {
        var result = Vector3.Zero();
        this.toEulerAnglesToRef(result);
        return result;
    }

    /**
     * Sets the given vector3 "result" with the Euler angles translated from the current quaternion
     * @param result defines the vector which will be filled with the Euler angles
     * @returns the current unchanged quaternion
     */
    public toEulerAnglesToRef(result: Vector3): Quaternion {

        var qz = this._z;
        var qx = this._x;
        var qy = this._y;
        var qw = this._w;

        var sqw = qw * qw;
        var sqz = qz * qz;
        var sqx = qx * qx;
        var sqy = qy * qy;

        var zAxisY = qy * qz - qx * qw;
        var limit = .4999999;

        if (zAxisY < -limit) {
            result.y = 2 * Math.atan2(qy, qw);
            result.x = Math.PI / 2;
            result.z = 0;
        } else if (zAxisY > limit) {
            result.y = 2 * Math.atan2(qy, qw);
            result.x = -Math.PI / 2;
            result.z = 0;
        } else {
            result.z = Math.atan2(2.0 * (qx * qy + qz * qw), (-sqz - sqx + sqy + sqw));
            result.x = Math.asin(-2.0 * (qz * qy - qx * qw));
            result.y = Math.atan2(2.0 * (qz * qx + qy * qw), (sqz - sqx - sqy + sqw));
        }

        return this;

    }

    /**
     * Updates the given rotation matrix with the current quaternion values
     * @param result defines the target matrix
     * @returns the current unchanged quaternion
     */
    public toRotationMatrix(result: Matrix): Quaternion {
        Matrix.FromQuaternionToRef(this, result);
        return this;
    }

    /**
     * Updates the current quaternion from the given rotation matrix values
     * @param matrix defines the source matrix
     * @returns the current updated quaternion
     */
    public fromRotationMatrix(matrix: DeepImmutable<Matrix>): Quaternion {
        Quaternion.FromRotationMatrixToRef(matrix, this);
        return this;
    }

    // Statics

    /**
     * Creates a new quaternion from a rotation matrix
     * @param matrix defines the source matrix
     * @returns a new quaternion created from the given rotation matrix values
     */
    public static FromRotationMatrix(matrix: DeepImmutable<Matrix>): Quaternion {
        var result = new Quaternion();
        Quaternion.FromRotationMatrixToRef(matrix, result);
        return result;
    }

    /**
     * Updates the given quaternion with the given rotation matrix values
     * @param matrix defines the source matrix
     * @param result defines the target quaternion
     */
    public static FromRotationMatrixToRef(matrix: DeepImmutable<Matrix>, result: Quaternion): void {
        var data = matrix.m;
        var m11 = data[0], m12 = data[4], m13 = data[8];
        var m21 = data[1], m22 = data[5], m23 = data[9];
        var m31 = data[2], m32 = data[6], m33 = data[10];
        var trace = m11 + m22 + m33;
        var s;

        if (trace > 0) {

            s = 0.5 / Math.sqrt(trace + 1.0);

            result.w = 0.25 / s;
            result.x = (m32 - m23) * s;
            result.y = (m13 - m31) * s;
            result.z = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            result.w = (m32 - m23) / s;
            result.x = 0.25 * s;
            result.y = (m12 + m21) / s;
            result.z = (m13 + m31) / s;
        } else if (m22 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            result.w = (m13 - m31) / s;
            result.x = (m12 + m21) / s;
            result.y = 0.25 * s;
            result.z = (m23 + m32) / s;
        } else {

            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            result.w = (m21 - m12) / s;
            result.x = (m13 + m31) / s;
            result.y = (m23 + m32) / s;
            result.z = 0.25 * s;
        }
    }

    /**
     * Returns the dot product (float) between the quaternions "left" and "right"
     * @param left defines the left operand
     * @param right defines the right operand
     * @returns the dot product
     */
    public static Dot(left: DeepImmutable<Quaternion>, right: DeepImmutable<Quaternion>): number {
        return (left._x * right._x + left._y * right._y + left._z * right._z + left._w * right._w);
    }

    /**
     * Checks if the two quaternions are close to each other
     * @param quat0 defines the first quaternion to check
     * @param quat1 defines the second quaternion to check
     * @returns true if the two quaternions are close to each other
     */
    public static AreClose(quat0: DeepImmutable<Quaternion>, quat1: DeepImmutable<Quaternion>): boolean {
        let dot = Quaternion.Dot(quat0, quat1);

        return dot >= 0;
    }

    /**
     * Smooth interpolation between two quaternions using Slerp
     *
     * @param source source quaternion
     * @param goal goal quaternion
     * @param deltaTime current interpolation frame
     * @param lerpTime total interpolation time
     * @param result the smoothed quaternion
     */
    public static SmoothToRef(source: Quaternion, goal: Quaternion, deltaTime: number, lerpTime: number, result: Quaternion) {
        let slerp = lerpTime === 0 ? 1 : deltaTime / lerpTime;
        slerp = Scalar.Clamp(slerp, 0, 1);

        Quaternion.SlerpToRef(source, goal, slerp, result);
    }

    /**
     * Creates an empty quaternion
     * @returns a new quaternion set to (0.0, 0.0, 0.0)
     */
    public static Zero(): Quaternion {
        return new Quaternion(0.0, 0.0, 0.0, 0.0);
    }

    /**
     * Inverse a given quaternion
     * @param q defines the source quaternion
     * @returns a new quaternion as the inverted current quaternion
     */
    public static Inverse(q: DeepImmutable<Quaternion>): Quaternion {
        return new Quaternion(-q._x, -q._y, -q._z, q._w);
    }

    /**
     * Inverse a given quaternion
     * @param q defines the source quaternion
     * @param result the quaternion the result will be stored in
     * @returns the result quaternion
     */
    public static InverseToRef(q: Quaternion, result: Quaternion): Quaternion {
        result.set(-q._x, -q._y, -q._z, q._w);
        return result;
    }

    /**
     * Creates an identity quaternion
     * @returns the identity quaternion
     */
    public static Identity(): Quaternion {
        return new Quaternion(0.0, 0.0, 0.0, 1.0);
    }

    /**
     * Gets a boolean indicating if the given quaternion is identity
     * @param quaternion defines the quaternion to check
     * @returns true if the quaternion is identity
     */
    public static IsIdentity(quaternion: DeepImmutable<Quaternion>): boolean {
        return quaternion && quaternion._x === 0 && quaternion._y === 0 && quaternion._z === 0 && quaternion._w === 1;
    }

    /**
     * Creates a quaternion from a rotation around an axis
     * @param axis defines the axis to use
     * @param angle defines the angle to use
     * @returns a new quaternion created from the given axis (Vector3) and angle in radians (float)
     */
    public static RotationAxis(axis: DeepImmutable<Vector3>, angle: number): Quaternion {
        return Quaternion.RotationAxisToRef(axis, angle, new Quaternion());
    }

    /**
     * Creates a rotation around an axis and stores it into the given quaternion
     * @param axis defines the axis to use
     * @param angle defines the angle to use
     * @param result defines the target quaternion
     * @returns the target quaternion
     */
    public static RotationAxisToRef(axis: DeepImmutable<Vector3>, angle: number, result: Quaternion): Quaternion {
        var sin = Math.sin(angle / 2);
        axis.normalize();
        result.w = Math.cos(angle / 2);
        result.x = axis._x * sin;
        result.y = axis._y * sin;
        result.z = axis._z * sin;
        return result;
    }

    /**
     * Creates a new quaternion from data stored into an array
     * @param array defines the data source
     * @param offset defines the offset in the source array where the data starts
     * @returns a new quaternion
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset?: number): Quaternion {
        if (!offset) {
            offset = 0;
        }
        return new Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    }

    /**
     * Updates the given quaternion "result" from the starting index of the given array.
     * @param array the array to pull values from
     * @param offset the offset into the array to start at
     * @param result the quaternion to store the result in
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number, result: Quaternion): void {
        result.x = array[offset];
        result.y = array[offset + 1];
        result.z = array[offset + 2];
        result.w = array[offset + 3];
    }

    /**
     * Create a quaternion from Euler rotation angles
     * @param x Pitch
     * @param y Yaw
     * @param z Roll
     * @returns the new Quaternion
     */
    public static FromEulerAngles(x: number, y: number, z: number): Quaternion {
        var q = new Quaternion();
        Quaternion.RotationYawPitchRollToRef(y, x, z, q);
        return q;
    }

    /**
     * Updates a quaternion from Euler rotation angles
     * @param x Pitch
     * @param y Yaw
     * @param z Roll
     * @param result the quaternion to store the result
     * @returns the updated quaternion
     */
    public static FromEulerAnglesToRef(x: number, y: number, z: number, result: Quaternion): Quaternion {
        Quaternion.RotationYawPitchRollToRef(y, x, z, result);
        return result;
    }

    /**
     * Create a quaternion from Euler rotation vector
     * @param vec the Euler vector (x Pitch, y Yaw, z Roll)
     * @returns the new Quaternion
     */
    public static FromEulerVector(vec: DeepImmutable<Vector3>): Quaternion {
        var q = new Quaternion();
        Quaternion.RotationYawPitchRollToRef(vec._y, vec._x, vec._z, q);
        return q;
    }

    /**
     * Updates a quaternion from Euler rotation vector
     * @param vec the Euler vector (x Pitch, y Yaw, z Roll)
     * @param result the quaternion to store the result
     * @returns the updated quaternion
     */
    public static FromEulerVectorToRef(vec: DeepImmutable<Vector3>, result: Quaternion): Quaternion {
        Quaternion.RotationYawPitchRollToRef(vec._y, vec._x, vec._z, result);
        return result;
    }

    /**
     * Updates a quaternion so that it rotates vector vecFrom to vector vecTo
     * @param vecFrom defines the direction vector from which to rotate
     * @param vecTo defines the direction vector to which to rotate
     * @param result the quaternion to store the result
     * @returns the updated quaternion
     */
    public static FromUnitVectorsToRef(vecFrom: DeepImmutable<Vector3>, vecTo: DeepImmutable<Vector3>, result: Quaternion): Quaternion {
        const r = Vector3.Dot(vecFrom, vecTo) + 1;

        if (r < Epsilon) {
            if (Math.abs(vecFrom.x) > Math.abs(vecFrom.z)) {
                result.set(-vecFrom.y, vecFrom.x, 0, 0);
            } else {
                result.set(0, - vecFrom.z, vecFrom.y, 0);
            }
        } else {
            Vector3.CrossToRef(vecFrom, vecTo, TmpVectors.Vector3[0]);
            result.set(
                TmpVectors.Vector3[0].x,
                TmpVectors.Vector3[0].y,
                TmpVectors.Vector3[0].z,
                r
            );
        }

        return result.normalize();
    }

    /**
     * Creates a new quaternion from the given Euler float angles (y, x, z)
     * @param yaw defines the rotation around Y axis
     * @param pitch defines the rotation around X axis
     * @param roll defines the rotation around Z axis
     * @returns the new quaternion
     */
    public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion {
        var q = new Quaternion();
        Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, q);
        return q;
    }

    /**
     * Creates a new rotation from the given Euler float angles (y, x, z) and stores it in the target quaternion
     * @param yaw defines the rotation around Y axis
     * @param pitch defines the rotation around X axis
     * @param roll defines the rotation around Z axis
     * @param result defines the target quaternion
     */
    public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void {
        // Produces a quaternion from Euler angles in the z-y-x orientation (Tait-Bryan angles)
        var halfRoll = roll * 0.5;
        var halfPitch = pitch * 0.5;
        var halfYaw = yaw * 0.5;

        var sinRoll = Math.sin(halfRoll);
        var cosRoll = Math.cos(halfRoll);
        var sinPitch = Math.sin(halfPitch);
        var cosPitch = Math.cos(halfPitch);
        var sinYaw = Math.sin(halfYaw);
        var cosYaw = Math.cos(halfYaw);

        result.x = (cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll);
        result.y = (sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll);
        result.z = (cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll);
        result.w = (cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll);
    }

    /**
     * Creates a new quaternion from the given Euler float angles expressed in z-x-z orientation
     * @param alpha defines the rotation around first axis
     * @param beta defines the rotation around second axis
     * @param gamma defines the rotation around third axis
     * @returns the new quaternion
     */
    public static RotationAlphaBetaGamma(alpha: number, beta: number, gamma: number): Quaternion {
        var result = new Quaternion();
        Quaternion.RotationAlphaBetaGammaToRef(alpha, beta, gamma, result);
        return result;
    }

    /**
     * Creates a new quaternion from the given Euler float angles expressed in z-x-z orientation and stores it in the target quaternion
     * @param alpha defines the rotation around first axis
     * @param beta defines the rotation around second axis
     * @param gamma defines the rotation around third axis
     * @param result defines the target quaternion
     */
    public static RotationAlphaBetaGammaToRef(alpha: number, beta: number, gamma: number, result: Quaternion): void {
        // Produces a quaternion from Euler angles in the z-x-z orientation
        var halfGammaPlusAlpha = (gamma + alpha) * 0.5;
        var halfGammaMinusAlpha = (gamma - alpha) * 0.5;
        var halfBeta = beta * 0.5;

        result.x = Math.cos(halfGammaMinusAlpha) * Math.sin(halfBeta);
        result.y = Math.sin(halfGammaMinusAlpha) * Math.sin(halfBeta);
        result.z = Math.sin(halfGammaPlusAlpha) * Math.cos(halfBeta);
        result.w = Math.cos(halfGammaPlusAlpha) * Math.cos(halfBeta);
    }

    /**
     * Creates a new quaternion containing the rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system (axis1, axis2 and axis3 are normalized during this operation)
     * @param axis1 defines the first axis
     * @param axis2 defines the second axis
     * @param axis3 defines the third axis
     * @returns the new quaternion
     */
    public static RotationQuaternionFromAxis(axis1: DeepImmutable<Vector3>, axis2: DeepImmutable<Vector3>, axis3: DeepImmutable<Vector3>): Quaternion {
        var quat = new Quaternion(0.0, 0.0, 0.0, 0.0);
        Quaternion.RotationQuaternionFromAxisToRef(axis1, axis2, axis3, quat);
        return quat;
    }

    /**
     * Creates a rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system (axis1, axis2 and axis3 are normalized during this operation) and stores it in the target quaternion
     * @param axis1 defines the first axis
     * @param axis2 defines the second axis
     * @param axis3 defines the third axis
     * @param ref defines the target quaternion
     */
    public static RotationQuaternionFromAxisToRef(axis1: DeepImmutable<Vector3>, axis2: DeepImmutable<Vector3>, axis3: DeepImmutable<Vector3>, ref: Quaternion): void {
        var rotMat = MathTmp.Matrix[0];
        Matrix.FromXYZAxesToRef(axis1.normalize(), axis2.normalize(), axis3.normalize(), rotMat);
        Quaternion.FromRotationMatrixToRef(rotMat, ref);
    }

    /**
     * Creates a new rotation value to orient an object to look towards the given forward direction, the up direction being oriented like "up".
     * This function works in left handed mode
     * @param forward defines the forward direction - Must be normalized and orthogonal to up.
     * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
     * @returns A new quaternion oriented toward the specified forward and up.
     */
    public static FromLookDirectionLH(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>): Quaternion {
        var quat = new Quaternion();
        Quaternion.FromLookDirectionLHToRef(forward, up, quat);
        return quat;
    }

    /**
    * Creates a new rotation value to orient an object to look towards the given forward direction with the up direction being oriented like "up", and stores it in the target quaternion.
    * This function works in left handed mode
    * @param forward defines the forward direction - Must be normalized and orthogonal to up.
    * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
    * @param ref defines the target quaternion.
    */
    public static FromLookDirectionLHToRef(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>, ref: Quaternion): void {
        var rotMat = MathTmp.Matrix[0];
        Matrix.LookDirectionLHToRef(forward, up, rotMat);
        Quaternion.FromRotationMatrixToRef(rotMat, ref);
    }

    /**
     * Creates a new rotation value to orient an object to look towards the given forward direction, the up direction being oriented like "up".
     * This function works in right handed mode
     * @param forward defines the forward direction - Must be normalized and orthogonal to up.
     * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
     * @returns A new quaternion oriented toward the specified forward and up.
     */
    public static FromLookDirectionRH(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>): Quaternion {
        var quat = new Quaternion();
        Quaternion.FromLookDirectionRHToRef(forward, up, quat);
        return quat;
    }

    /**
     * Creates a new rotation value to orient an object to look towards the given forward direction with the up direction being oriented like "up", and stores it in the target quaternion.
     * This function works in right handed mode
     * @param forward defines the forward direction - Must be normalized and orthogonal to up.
     * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
     * @param ref defines the target quaternion.
     */
    public static FromLookDirectionRHToRef(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>, ref: Quaternion): void {
        var rotMat = MathTmp.Matrix[0];
        Matrix.LookDirectionRHToRef(forward, up, rotMat);
        return Quaternion.FromRotationMatrixToRef(rotMat, ref);
    }

    /**
     * Interpolates between two quaternions
     * @param left defines first quaternion
     * @param right defines second quaternion
     * @param amount defines the gradient to use
     * @returns the new interpolated quaternion
     */
    public static Slerp(left: DeepImmutable<Quaternion>, right: DeepImmutable<Quaternion>, amount: number): Quaternion {
        var result = Quaternion.Identity();

        Quaternion.SlerpToRef(left, right, amount, result);

        return result;
    }

    /**
     * Interpolates between two quaternions and stores it into a target quaternion
     * @param left defines first quaternion
     * @param right defines second quaternion
     * @param amount defines the gradient to use
     * @param result defines the target quaternion
     */
    public static SlerpToRef(left: DeepImmutable<Quaternion>, right: DeepImmutable<Quaternion>, amount: number, result: Quaternion): void {
        var num2;
        var num3;
        var num4 = (((left._x * right._x) + (left._y * right._y)) + (left._z * right._z)) + (left._w * right._w);
        var flag = false;

        if (num4 < 0) {
            flag = true;
            num4 = -num4;
        }

        if (num4 > 0.999999) {
            num3 = 1 - amount;
            num2 = flag ? -amount : amount;
        }
        else {
            var num5 = Math.acos(num4);
            var num6 = (1.0 / Math.sin(num5));
            num3 = (Math.sin((1.0 - amount) * num5)) * num6;
            num2 = flag ? ((-Math.sin(amount * num5)) * num6) : ((Math.sin(amount * num5)) * num6);
        }

        result.x = (num3 * left._x) + (num2 * right._x);
        result.y = (num3 * left._y) + (num2 * right._y);
        result.z = (num3 * left._z) + (num2 * right._z);
        result.w = (num3 * left._w) + (num2 * right._w);
    }

    /**
     * Interpolate between two quaternions using Hermite interpolation
     * @param value1 defines first quaternion
     * @param tangent1 defines the incoming tangent
     * @param value2 defines second quaternion
     * @param tangent2 defines the outgoing tangent
     * @param amount defines the target quaternion
     * @returns the new interpolated quaternion
     */
    public static Hermite(value1: DeepImmutable<Quaternion>, tangent1: DeepImmutable<Quaternion>, value2: DeepImmutable<Quaternion>, tangent2: DeepImmutable<Quaternion>, amount: number): Quaternion {
        var squared = amount * amount;
        var cubed = amount * squared;
        var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
        var part2 = (-2.0 * cubed) + (3.0 * squared);
        var part3 = (cubed - (2.0 * squared)) + amount;
        var part4 = cubed - squared;

        var x = (((value1._x * part1) + (value2._x * part2)) + (tangent1._x * part3)) + (tangent2._x * part4);
        var y = (((value1._y * part1) + (value2._y * part2)) + (tangent1._y * part3)) + (tangent2._y * part4);
        var z = (((value1._z * part1) + (value2._z * part2)) + (tangent1._z * part3)) + (tangent2._z * part4);
        var w = (((value1._w * part1) + (value2._w * part2)) + (tangent1._w * part3)) + (tangent2._w * part4);
        return new Quaternion(x, y, z, w);
    }

    /**
     * Returns a new Quaternion which is the 1st derivative of the Hermite spline defined by the quaternions "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
    public static Hermite1stDerivative(value1: DeepImmutable<Quaternion>, tangent1: DeepImmutable<Quaternion>, value2: DeepImmutable<Quaternion>, tangent2: DeepImmutable<Quaternion>, time: number): Quaternion {
        let result = Quaternion.Zero();

        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);

        return result;
    }

    /**
     * Update a Quaternion with the 1st derivative of the Hermite spline defined by the quaternions "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where to store the derivative
     */
    public static Hermite1stDerivativeToRef(value1: DeepImmutable<Quaternion>, tangent1: DeepImmutable<Quaternion>, value2: DeepImmutable<Quaternion>, tangent2: DeepImmutable<Quaternion>, time: number, result: Quaternion)  {
        const t2 = time * time;

        result.x = (t2 - time) * 6 * value1.x + (3 * t2 - 4 * time + 1) * tangent1.x + (-t2 + time) * 6 * value2.x + (3 * t2 - 2 * time) * tangent2.x;
        result.y = (t2 - time) * 6 * value1.y + (3 * t2 - 4 * time + 1) * tangent1.y + (-t2 + time) * 6 * value2.y + (3 * t2 - 2 * time) * tangent2.y;
        result.z = (t2 - time) * 6 * value1.z + (3 * t2 - 4 * time + 1) * tangent1.z + (-t2 + time) * 6 * value2.z + (3 * t2 - 2 * time) * tangent2.z;
        result.w = (t2 - time) * 6 * value1.w + (3 * t2 - 4 * time + 1) * tangent1.w + (-t2 + time) * 6 * value2.w + (3 * t2 - 2 * time) * tangent2.w;
    }
}

/**
 * Class used to store matrix data (4x4)
 */
export class Matrix {

    /**
     * Gets the precision of matrix computations
     */
    public static get Use64Bits(): boolean {
        return PerformanceConfigurator.MatrixUse64Bits;
    }

    private static _updateFlagSeed = 0;
    private static _identityReadOnly = Matrix.Identity() as DeepImmutable<Matrix>;

    private _isIdentity = false;
    private _isIdentityDirty = true;
    private _isIdentity3x2 = true;
    private _isIdentity3x2Dirty = true;
    /**
     * Gets the update flag of the matrix which is an unique number for the matrix.
     * It will be incremented every time the matrix data change.
     * You can use it to speed the comparison between two versions of the same matrix.
     */
    public updateFlag: number = -1;

    private readonly _m: Float32Array | Array<number>;

    /**
     * Gets the internal data of the matrix
     */
    public get m(): DeepImmutable<Float32Array | Array<number>> { return this._m; }

    /** @hidden */
    public _markAsUpdated() {
        this.updateFlag = Matrix._updateFlagSeed++;
        this._isIdentity = false;
        this._isIdentity3x2 = false;
        this._isIdentityDirty = true;
        this._isIdentity3x2Dirty = true;
    }

    /** @hidden */
    private _updateIdentityStatus(isIdentity: boolean, isIdentityDirty: boolean = false, isIdentity3x2: boolean = false, isIdentity3x2Dirty: boolean = true) {
        this.updateFlag = Matrix._updateFlagSeed++;
        this._isIdentity = isIdentity;
        this._isIdentity3x2 = isIdentity || isIdentity3x2;
        this._isIdentityDirty = this._isIdentity ? false : isIdentityDirty;
        this._isIdentity3x2Dirty = this._isIdentity3x2 ? false : isIdentity3x2Dirty;
    }

    /**
     * Creates an empty matrix (filled with zeros)
     */
    public constructor() {
        if (PerformanceConfigurator.MatrixTrackPrecisionChange) {
            PerformanceConfigurator.MatrixTrackedMatrices!.push(this);
        }

        this._m = new PerformanceConfigurator.MatrixCurrentType(16);
        this._updateIdentityStatus(false);
    }

    // Properties

    /**
     * Check if the current matrix is identity
     * @returns true is the matrix is the identity matrix
     */
    public isIdentity(): boolean {
        if (this._isIdentityDirty) {
            this._isIdentityDirty = false;
            const m = this._m;
            this._isIdentity = (
                m[0] === 1.0 && m[1] === 0.0 && m[2] === 0.0 && m[3] === 0.0 &&
                m[4] === 0.0 && m[5] === 1.0 && m[6] === 0.0 && m[7] === 0.0 &&
                m[8] === 0.0 && m[9] === 0.0 && m[10] === 1.0 && m[11] === 0.0 &&
                m[12] === 0.0 && m[13] === 0.0 && m[14] === 0.0 && m[15] === 1.0
            );
        }

        return this._isIdentity;
    }

    /**
     * Check if the current matrix is identity as a texture matrix (3x2 store in 4x4)
     * @returns true is the matrix is the identity matrix
     */
    public isIdentityAs3x2(): boolean {
        if (this._isIdentity3x2Dirty) {
            this._isIdentity3x2Dirty = false;
            if (this._m[0] !== 1.0 || this._m[5] !== 1.0 || this._m[15] !== 1.0) {
                this._isIdentity3x2 = false;
            } else if (this._m[1] !== 0.0 || this._m[2] !== 0.0 || this._m[3] !== 0.0 ||
                this._m[4] !== 0.0 || this._m[6] !== 0.0 || this._m[7] !== 0.0 ||
                this._m[8] !== 0.0 || this._m[9] !== 0.0 || this._m[10] !== 0.0 || this._m[11] !== 0.0 ||
                this._m[12] !== 0.0 || this._m[13] !== 0.0 || this._m[14] !== 0.0) {
                this._isIdentity3x2 = false;
            } else {
                this._isIdentity3x2 = true;
            }
        }

        return this._isIdentity3x2;
    }

    /**
     * Gets the determinant of the matrix
     * @returns the matrix determinant
     */
    public determinant(): number {
        if (this._isIdentity === true) {
            return 1;
        }

        const m = this._m;
        const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
        const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
        const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
        const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];
        // https://en.wikipedia.org/wiki/Laplace_expansion
        // to compute the deterrminant of a 4x4 Matrix we compute the cofactors of any row or column,
        // then we multiply each Cofactor by its corresponding matrix value and sum them all to get the determinant
        // Cofactor(i, j) = sign(i,j) * det(Minor(i, j))
        // where
        //  - sign(i,j) = (i+j) % 2 === 0 ? 1 : -1
        //  - Minor(i, j) is the 3x3 matrix we get by removing row i and column j from current Matrix
        //
        // Here we do that for the 1st row.

        const det_22_33 = m22 * m33 - m32 * m23;
        const det_21_33 = m21 * m33 - m31 * m23;
        const det_21_32 = m21 * m32 - m31 * m22;
        const det_20_33 = m20 * m33 - m30 * m23;
        const det_20_32 = m20 * m32 - m22 * m30;
        const det_20_31 = m20 * m31 - m30 * m21;
        const cofact_00 = +(m11 * det_22_33 - m12 * det_21_33 + m13 * det_21_32);
        const cofact_01 = -(m10 * det_22_33 - m12 * det_20_33 + m13 * det_20_32);
        const cofact_02 = +(m10 * det_21_33 - m11 * det_20_33 + m13 * det_20_31);
        const cofact_03 = -(m10 * det_21_32 - m11 * det_20_32 + m12 * det_20_31);
        return m00 * cofact_00 + m01 * cofact_01 + m02 * cofact_02 + m03 * cofact_03;
    }

    // Methods

    /**
     * Returns the matrix as a Float32Array or Array<number>
     * @returns the matrix underlying array
     */
    public toArray(): DeepImmutable<Float32Array | Array<number>> {
        return this._m;
    }
    /**
     * Returns the matrix as a Float32Array or Array<number>
    * @returns the matrix underlying array.
    */
    public asArray(): DeepImmutable<Float32Array | Array<number>> {
        return this._m;
    }

    /**
     * Inverts the current matrix in place
     * @returns the current inverted matrix
     */
    public invert(): Matrix {
        this.invertToRef(this);
        return this;
    }
    /**
     * Sets all the matrix elements to zero
     * @returns the current matrix
     */
    public reset(): Matrix {
        Matrix.FromValuesToRef(
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            this
        );
        this._updateIdentityStatus(false);
        return this;
    }

    /**
     * Adds the current matrix with a second one
     * @param other defines the matrix to add
     * @returns a new matrix as the addition of the current matrix and the given one
     */
    public add(other: DeepImmutable<Matrix>): Matrix {
        var result = new Matrix();
        this.addToRef(other, result);
        return result;
    }

    /**
     * Sets the given matrix "result" to the addition of the current matrix and the given one
     * @param other defines the matrix to add
     * @param result defines the target matrix
     * @returns the current matrix
     */
    public addToRef(other: DeepImmutable<Matrix>, result: Matrix): Matrix {
        const m = this._m;
        const resultM = result._m;
        const otherM = other.m;
        for (var index = 0; index < 16; index++) {
            resultM[index] = m[index] + otherM[index];
        }
        result._markAsUpdated();
        return this;
    }

    /**
     * Adds in place the given matrix to the current matrix
     * @param other defines the second operand
     * @returns the current updated matrix
     */
    public addToSelf(other: DeepImmutable<Matrix>): Matrix {
        const m = this._m;
        const otherM = other.m;
        for (var index = 0; index < 16; index++) {
            m[index] += otherM[index];
        }
        this._markAsUpdated();
        return this;
    }

    /**
     * Sets the given matrix to the current inverted Matrix
     * @param other defines the target matrix
     * @returns the unmodified current matrix
     */
    public invertToRef(other: Matrix): Matrix {
        if (this._isIdentity === true) {
            Matrix.IdentityToRef(other);
            return this;
        }

        // the inverse of a Matrix is the transpose of cofactor matrix divided by the determinant
        const m = this._m;
        const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
        const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
        const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
        const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

        const det_22_33 = m22 * m33 - m32 * m23;
        const det_21_33 = m21 * m33 - m31 * m23;
        const det_21_32 = m21 * m32 - m31 * m22;
        const det_20_33 = m20 * m33 - m30 * m23;
        const det_20_32 = m20 * m32 - m22 * m30;
        const det_20_31 = m20 * m31 - m30 * m21;

        const cofact_00 = +(m11 * det_22_33 - m12 * det_21_33 + m13 * det_21_32);
        const cofact_01 = -(m10 * det_22_33 - m12 * det_20_33 + m13 * det_20_32);
        const cofact_02 = +(m10 * det_21_33 - m11 * det_20_33 + m13 * det_20_31);
        const cofact_03 = -(m10 * det_21_32 - m11 * det_20_32 + m12 * det_20_31);

        const det = m00 * cofact_00 + m01 * cofact_01 + m02 * cofact_02 + m03 * cofact_03;

        if (det === 0) {
            // not invertible
            other.copyFrom(this);
            return this;
        }

        const detInv = 1 / det;
        const det_12_33 = m12 * m33 - m32 * m13;
        const det_11_33 = m11 * m33 - m31 * m13;
        const det_11_32 = m11 * m32 - m31 * m12;
        const det_10_33 = m10 * m33 - m30 * m13;
        const det_10_32 = m10 * m32 - m30 * m12;
        const det_10_31 = m10 * m31 - m30 * m11;
        const det_12_23 = m12 * m23 - m22 * m13;
        const det_11_23 = m11 * m23 - m21 * m13;
        const det_11_22 = m11 * m22 - m21 * m12;
        const det_10_23 = m10 * m23 - m20 * m13;
        const det_10_22 = m10 * m22 - m20 * m12;
        const det_10_21 = m10 * m21 - m20 * m11;

        const cofact_10 = -(m01 * det_22_33 - m02 * det_21_33 + m03 * det_21_32);
        const cofact_11 = +(m00 * det_22_33 - m02 * det_20_33 + m03 * det_20_32);
        const cofact_12 = -(m00 * det_21_33 - m01 * det_20_33 + m03 * det_20_31);
        const cofact_13 = +(m00 * det_21_32 - m01 * det_20_32 + m02 * det_20_31);

        const cofact_20 = +(m01 * det_12_33 - m02 * det_11_33 + m03 * det_11_32);
        const cofact_21 = -(m00 * det_12_33 - m02 * det_10_33 + m03 * det_10_32);
        const cofact_22 = +(m00 * det_11_33 - m01 * det_10_33 + m03 * det_10_31);
        const cofact_23 = -(m00 * det_11_32 - m01 * det_10_32 + m02 * det_10_31);

        const cofact_30 = -(m01 * det_12_23 - m02 * det_11_23 + m03 * det_11_22);
        const cofact_31 = +(m00 * det_12_23 - m02 * det_10_23 + m03 * det_10_22);
        const cofact_32 = -(m00 * det_11_23 - m01 * det_10_23 + m03 * det_10_21);
        const cofact_33 = +(m00 * det_11_22 - m01 * det_10_22 + m02 * det_10_21);

        Matrix.FromValuesToRef(
            cofact_00 * detInv, cofact_10 * detInv, cofact_20 * detInv, cofact_30 * detInv,
            cofact_01 * detInv, cofact_11 * detInv, cofact_21 * detInv, cofact_31 * detInv,
            cofact_02 * detInv, cofact_12 * detInv, cofact_22 * detInv, cofact_32 * detInv,
            cofact_03 * detInv, cofact_13 * detInv, cofact_23 * detInv, cofact_33 * detInv,
            other
        );

        return this;
    }

    /**
     * add a value at the specified position in the current Matrix
     * @param index the index of the value within the matrix. between 0 and 15.
     * @param value the value to be added
     * @returns the current updated matrix
     */
    public addAtIndex(index: number, value: number): Matrix {
        this._m[index] += value;
        this._markAsUpdated();
        return this;
    }

    /**
     * mutiply the specified position in the current Matrix by a value
     * @param index the index of the value within the matrix. between 0 and 15.
     * @param value the value to be added
     * @returns the current updated matrix
     */
    public multiplyAtIndex(index: number, value: number): Matrix {
        this._m[index] *= value;
        this._markAsUpdated();
        return this;
    }

    /**
     * Inserts the translation vector (using 3 floats) in the current matrix
     * @param x defines the 1st component of the translation
     * @param y defines the 2nd component of the translation
     * @param z defines the 3rd component of the translation
     * @returns the current updated matrix
     */
    public setTranslationFromFloats(x: number, y: number, z: number): Matrix {
        this._m[12] = x;
        this._m[13] = y;
        this._m[14] = z;
        this._markAsUpdated();
        return this;
    }

    /**
     * Adds the translation vector (using 3 floats) in the current matrix
     * @param x defines the 1st component of the translation
     * @param y defines the 2nd component of the translation
     * @param z defines the 3rd component of the translation
     * @returns the current updated matrix
     */
    public addTranslationFromFloats(x: number, y: number, z: number): Matrix {
        this._m[12] += x;
        this._m[13] += y;
        this._m[14] += z;
        this._markAsUpdated();
        return this;
    }

    /**
     * Inserts the translation vector in the current matrix
     * @param vector3 defines the translation to insert
     * @returns the current updated matrix
     */
    public setTranslation(vector3: DeepImmutable<Vector3>): Matrix {
        return this.setTranslationFromFloats(vector3._x, vector3._y, vector3._z);
    }

    /**
     * Gets the translation value of the current matrix
     * @returns a new Vector3 as the extracted translation from the matrix
     */
    public getTranslation(): Vector3 {
        return new Vector3(this._m[12], this._m[13], this._m[14]);
    }

    /**
     * Fill a Vector3 with the extracted translation from the matrix
     * @param result defines the Vector3 where to store the translation
     * @returns the current matrix
     */
    public getTranslationToRef(result: Vector3): Matrix {
        result.x = this._m[12];
        result.y = this._m[13];
        result.z = this._m[14];
        return this;
    }

    /**
     * Remove rotation and scaling part from the matrix
     * @returns the updated matrix
     */
    public removeRotationAndScaling(): Matrix {
        const m = this.m;
        Matrix.FromValuesToRef(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            m[12], m[13], m[14], m[15],
            this
        );
        this._updateIdentityStatus(m[12] === 0 && m[13] === 0 && m[14] === 0 && m[15] === 1);
        return this;
    }

    /**
     * Multiply two matrices
     * @param other defines the second operand
     * @returns a new matrix set with the multiplication result of the current Matrix and the given one
     */
    public multiply(other: DeepImmutable<Matrix>): Matrix {
        var result = new Matrix();
        this.multiplyToRef(other, result);
        return result;
    }

    /**
     * Copy the current matrix from the given one
     * @param other defines the source matrix
     * @returns the current updated matrix
     */
    public copyFrom(other: DeepImmutable<Matrix>): Matrix {
        other.copyToArray(this._m);
        const o = (other as Matrix);
        this._updateIdentityStatus(o._isIdentity, o._isIdentityDirty, o._isIdentity3x2, o._isIdentity3x2Dirty);
        return this;
    }

    /**
     * Populates the given array from the starting index with the current matrix values
     * @param array defines the target array
     * @param offset defines the offset in the target array where to start storing values
     * @returns the current matrix
     */
    public copyToArray(array: Float32Array | Array<number>, offset: number = 0): Matrix {
        let source = this._m;
        array[offset] = source[0];
        array[offset + 1] = source[1];
        array[offset + 2] = source[2];
        array[offset + 3] = source[3];
        array[offset + 4] = source[4];
        array[offset + 5] = source[5];
        array[offset + 6] = source[6];
        array[offset + 7] = source[7];
        array[offset + 8] = source[8];
        array[offset + 9] = source[9];
        array[offset + 10] = source[10];
        array[offset + 11] = source[11];
        array[offset + 12] = source[12];
        array[offset + 13] = source[13];
        array[offset + 14] = source[14];
        array[offset + 15] = source[15];

        return this;
    }

    /**
     * Sets the given matrix "result" with the multiplication result of the current Matrix and the given one
     * @param other defines the second operand
     * @param result defines the matrix where to store the multiplication
     * @returns the current matrix
     */
    public multiplyToRef(other: DeepImmutable<Matrix>, result: Matrix): Matrix {
        if (this._isIdentity) {
            result.copyFrom(other);
            return this;
        }
        if ((other as Matrix)._isIdentity) {
            result.copyFrom(this);
            return this;
        }

        this.multiplyToArray(other, result._m, 0);
        result._markAsUpdated();
        return this;
    }

    /**
     * Sets the Float32Array "result" from the given index "offset" with the multiplication of the current matrix and the given one
     * @param other defines the second operand
     * @param result defines the array where to store the multiplication
     * @param offset defines the offset in the target array where to start storing values
     * @returns the current matrix
     */
    public multiplyToArray(other: DeepImmutable<Matrix>, result: Float32Array | Array<number>, offset: number): Matrix {
        const m = this._m;
        const otherM = other.m;
        var tm0 = m[0], tm1 = m[1], tm2 = m[2], tm3 = m[3];
        var tm4 = m[4], tm5 = m[5], tm6 = m[6], tm7 = m[7];
        var tm8 = m[8], tm9 = m[9], tm10 = m[10], tm11 = m[11];
        var tm12 = m[12], tm13 = m[13], tm14 = m[14], tm15 = m[15];

        var om0 = otherM[0], om1 = otherM[1], om2 = otherM[2], om3 = otherM[3];
        var om4 = otherM[4], om5 = otherM[5], om6 = otherM[6], om7 = otherM[7];
        var om8 = otherM[8], om9 = otherM[9], om10 = otherM[10], om11 = otherM[11];
        var om12 = otherM[12], om13 = otherM[13], om14 = otherM[14], om15 = otherM[15];

        result[offset] = tm0 * om0 + tm1 * om4 + tm2 * om8 + tm3 * om12;
        result[offset + 1] = tm0 * om1 + tm1 * om5 + tm2 * om9 + tm3 * om13;
        result[offset + 2] = tm0 * om2 + tm1 * om6 + tm2 * om10 + tm3 * om14;
        result[offset + 3] = tm0 * om3 + tm1 * om7 + tm2 * om11 + tm3 * om15;

        result[offset + 4] = tm4 * om0 + tm5 * om4 + tm6 * om8 + tm7 * om12;
        result[offset + 5] = tm4 * om1 + tm5 * om5 + tm6 * om9 + tm7 * om13;
        result[offset + 6] = tm4 * om2 + tm5 * om6 + tm6 * om10 + tm7 * om14;
        result[offset + 7] = tm4 * om3 + tm5 * om7 + tm6 * om11 + tm7 * om15;

        result[offset + 8] = tm8 * om0 + tm9 * om4 + tm10 * om8 + tm11 * om12;
        result[offset + 9] = tm8 * om1 + tm9 * om5 + tm10 * om9 + tm11 * om13;
        result[offset + 10] = tm8 * om2 + tm9 * om6 + tm10 * om10 + tm11 * om14;
        result[offset + 11] = tm8 * om3 + tm9 * om7 + tm10 * om11 + tm11 * om15;

        result[offset + 12] = tm12 * om0 + tm13 * om4 + tm14 * om8 + tm15 * om12;
        result[offset + 13] = tm12 * om1 + tm13 * om5 + tm14 * om9 + tm15 * om13;
        result[offset + 14] = tm12 * om2 + tm13 * om6 + tm14 * om10 + tm15 * om14;
        result[offset + 15] = tm12 * om3 + tm13 * om7 + tm14 * om11 + tm15 * om15;
        return this;
    }

    /**
     * Check equality between this matrix and a second one
     * @param value defines the second matrix to compare
     * @returns true is the current matrix and the given one values are strictly equal
     */
    public equals(value: DeepImmutable<Matrix>): boolean {
        const other = (value as Matrix);
        if (!other) {
            return false;
        }

        if (this._isIdentity || other._isIdentity) {
            if (!this._isIdentityDirty && !other._isIdentityDirty) {
                return this._isIdentity && other._isIdentity;
            }
        }

        const m = this.m;
        const om = other.m;
        return (
            m[0] === om[0] && m[1] === om[1] && m[2] === om[2] && m[3] === om[3] &&
            m[4] === om[4] && m[5] === om[5] && m[6] === om[6] && m[7] === om[7] &&
            m[8] === om[8] && m[9] === om[9] && m[10] === om[10] && m[11] === om[11] &&
            m[12] === om[12] && m[13] === om[13] && m[14] === om[14] && m[15] === om[15]
        );
    }

    /**
     * Clone the current matrix
     * @returns a new matrix from the current matrix
     */
    public clone(): Matrix {
        const matrix = new Matrix();
        matrix.copyFrom(this);
        return matrix;
    }

    /**
     * Returns the name of the current matrix class
     * @returns the string "Matrix"
     */
    public getClassName(): string {
        return "Matrix";
    }

    /**
     * Gets the hash code of the current matrix
     * @returns the hash code
     */
    public getHashCode(): number {
        let hash = this._m[0] | 0;
        for (let i = 1; i < 16; i++) {
            hash = (hash * 397) ^ (this._m[i] | 0);
        }
        return hash;
    }

    /**
     * Decomposes the current Matrix into a translation, rotation and scaling components of the provided node
     * @param node the node to decompose the matrix to
     * @returns true if operation was successful
     */
    public decomposeToTransformNode(node: TransformNode): boolean {
        node.rotationQuaternion = node.rotationQuaternion || new Quaternion();
        return this.decompose(node.scaling, node.rotationQuaternion, node.position);
    }

    /**
     * Decomposes the current Matrix into a translation, rotation and scaling components
     * @param scale defines the scale vector3 given as a reference to update
     * @param rotation defines the rotation quaternion given as a reference to update
     * @param translation defines the translation vector3 given as a reference to update
     * @returns true if operation was successful
     */
    public decompose(scale?: Vector3, rotation?: Quaternion, translation?: Vector3): boolean {
        if (this._isIdentity) {
            if (translation) {
                translation.setAll(0);
            }
            if (scale) {
                scale.setAll(1);
            }
            if (rotation) {
                rotation.copyFromFloats(0, 0, 0, 1);
            }
            return true;
        }

        const m = this._m;
        if (translation) {
            translation.copyFromFloats(m[12], m[13], m[14]);
        }

        scale = scale || MathTmp.Vector3[0];
        scale.x = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
        scale.y = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
        scale.z = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);

        if (this.determinant() <= 0) {
            scale.y *= -1;
        }

        if (scale._x === 0 || scale._y === 0 || scale._z === 0) {
            if (rotation) {
                rotation.copyFromFloats(0.0, 0.0, 0.0, 1.0);
            }
            return false;
        }

        if (rotation) {
            const sx = 1 / scale._x, sy = 1 / scale._y, sz = 1 / scale._z;
            Matrix.FromValuesToRef(
                m[0] * sx, m[1] * sx, m[2] * sx, 0.0,
                m[4] * sy, m[5] * sy, m[6] * sy, 0.0,
                m[8] * sz, m[9] * sz, m[10] * sz, 0.0,
                0.0, 0.0, 0.0, 1.0,
                MathTmp.Matrix[0]
            );

            Quaternion.FromRotationMatrixToRef(MathTmp.Matrix[0], rotation);
        }

        return true;
    }

    /**
     * Gets specific row of the matrix
     * @param index defines the number of the row to get
     * @returns the index-th row of the current matrix as a new Vector4
     */
    public getRow(index: number): Nullable<Vector4> {
        if (index < 0 || index > 3) {
            return null;
        }
        var i = index * 4;
        return new Vector4(this._m[i + 0], this._m[i + 1], this._m[i + 2], this._m[i + 3]);
    }

    /**
     * Sets the index-th row of the current matrix to the vector4 values
     * @param index defines the number of the row to set
     * @param row defines the target vector4
     * @returns the updated current matrix
     */
    public setRow(index: number, row: Vector4): Matrix {
        return this.setRowFromFloats(index, row.x, row.y, row.z, row.w);
    }

    /**
     * Compute the transpose of the matrix
     * @returns the new transposed matrix
     */
    public transpose(): Matrix {
        return Matrix.Transpose(this);
    }

    /**
     * Compute the transpose of the matrix and store it in a given matrix
     * @param result defines the target matrix
     * @returns the current matrix
     */
    public transposeToRef(result: Matrix): Matrix {
        Matrix.TransposeToRef(this, result);
        return this;
    }

    /**
     * Sets the index-th row of the current matrix with the given 4 x float values
     * @param index defines the row index
     * @param x defines the x component to set
     * @param y defines the y component to set
     * @param z defines the z component to set
     * @param w defines the w component to set
     * @returns the updated current matrix
     */
    public setRowFromFloats(index: number, x: number, y: number, z: number, w: number): Matrix {
        if (index < 0 || index > 3) {
            return this;
        }
        var i = index * 4;
        this._m[i + 0] = x;
        this._m[i + 1] = y;
        this._m[i + 2] = z;
        this._m[i + 3] = w;

        this._markAsUpdated();
        return this;
    }

    /**
     * Compute a new matrix set with the current matrix values multiplied by scale (float)
     * @param scale defines the scale factor
     * @returns a new matrix
     */
    public scale(scale: number): Matrix {
        var result = new Matrix();
        this.scaleToRef(scale, result);
        return result;
    }

    /**
     * Scale the current matrix values by a factor to a given result matrix
     * @param scale defines the scale factor
     * @param result defines the matrix to store the result
     * @returns the current matrix
     */
    public scaleToRef(scale: number, result: Matrix): Matrix {
        for (var index = 0; index < 16; index++) {
            result._m[index] = this._m[index] * scale;
        }
        result._markAsUpdated();
        return this;
    }

    /**
     * Scale the current matrix values by a factor and add the result to a given matrix
     * @param scale defines the scale factor
     * @param result defines the Matrix to store the result
     * @returns the current matrix
     */
    public scaleAndAddToRef(scale: number, result: Matrix): Matrix {
        for (var index = 0; index < 16; index++) {
            result._m[index] += this._m[index] * scale;
        }
        result._markAsUpdated();
        return this;
    }

    /**
     * Writes to the given matrix a normal matrix, computed from this one (using values from identity matrix for fourth row and column).
     * @param ref matrix to store the result
     */
    public toNormalMatrix(ref: Matrix): void {
        const tmp = MathTmp.Matrix[0];
        this.invertToRef(tmp);
        tmp.transposeToRef(ref);
        var m = ref._m;
        Matrix.FromValuesToRef(
            m[0], m[1], m[2], 0.0,
            m[4], m[5], m[6], 0.0,
            m[8], m[9], m[10], 0.0,
            0.0, 0.0, 0.0, 1.0,
            ref
        );
    }

    /**
     * Gets only rotation part of the current matrix
     * @returns a new matrix sets to the extracted rotation matrix from the current one
     */
    public getRotationMatrix(): Matrix {
        var result = new Matrix();
        this.getRotationMatrixToRef(result);
        return result;
    }

    /**
     * Extracts the rotation matrix from the current one and sets it as the given "result"
     * @param result defines the target matrix to store data to
     * @returns the current matrix
     */
    public getRotationMatrixToRef(result: Matrix): Matrix {
        const scale = MathTmp.Vector3[0];
        if (!this.decompose(scale)) {
            Matrix.IdentityToRef(result);
            return this;
        }

        const m = this._m;
        const sx = 1 / scale._x, sy = 1 / scale._y, sz = 1 / scale._z;
        Matrix.FromValuesToRef(
            m[0] * sx, m[1] * sx, m[2] * sx, 0.0,
            m[4] * sy, m[5] * sy, m[6] * sy, 0.0,
            m[8] * sz, m[9] * sz, m[10] * sz, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );
        return this;
    }

    /**
     * Toggles model matrix from being right handed to left handed in place and vice versa
     */
    public toggleModelMatrixHandInPlace() {
        const m = this._m;
        m[2] *= -1;
        m[6] *= -1;
        m[8] *= -1;
        m[9] *= -1;
        m[14] *= -1;
        this._markAsUpdated();
    }

    /**
     * Toggles projection matrix from being right handed to left handed in place and vice versa
     */
    public toggleProjectionMatrixHandInPlace() {
        var m = this._m;
        m[8] *= -1;
        m[9] *= -1;
        m[10] *= -1;
        m[11] *= -1;
        this._markAsUpdated();
    }

    // Statics
    /**
     * Creates a matrix from an array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns a new Matrix set from the starting index of the given array
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Matrix {
        var result = new Matrix();
        Matrix.FromArrayToRef(array, offset, result);
        return result;
    }

    /**
     * Copy the content of an array into a given matrix
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @param result defines the target matrix
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number, result: Matrix) {
        for (var index = 0; index < 16; index++) {
            result._m[index] = array[index + offset];
        }
        result._markAsUpdated();
    }

    /**
     * Stores an array into a matrix after having multiplied each component by a given factor
     * @param array defines the source array
     * @param offset defines the offset in the source array
     * @param scale defines the scaling factor
     * @param result defines the target matrix
     */
    public static FromFloat32ArrayToRefScaled(array: DeepImmutable<Float32Array | Array<number>>, offset: number, scale: number, result: Matrix) {
        for (var index = 0; index < 16; index++) {
            result._m[index] = array[index + offset] * scale;
        }
        result._markAsUpdated();
    }

    /**
     * Gets an identity matrix that must not be updated
     */
    public static get IdentityReadOnly(): DeepImmutable<Matrix> {
        return Matrix._identityReadOnly;
    }

    /**
     * Stores a list of values (16) inside a given matrix
     * @param initialM11 defines 1st value of 1st row
     * @param initialM12 defines 2nd value of 1st row
     * @param initialM13 defines 3rd value of 1st row
     * @param initialM14 defines 4th value of 1st row
     * @param initialM21 defines 1st value of 2nd row
     * @param initialM22 defines 2nd value of 2nd row
     * @param initialM23 defines 3rd value of 2nd row
     * @param initialM24 defines 4th value of 2nd row
     * @param initialM31 defines 1st value of 3rd row
     * @param initialM32 defines 2nd value of 3rd row
     * @param initialM33 defines 3rd value of 3rd row
     * @param initialM34 defines 4th value of 3rd row
     * @param initialM41 defines 1st value of 4th row
     * @param initialM42 defines 2nd value of 4th row
     * @param initialM43 defines 3rd value of 4th row
     * @param initialM44 defines 4th value of 4th row
     * @param result defines the target matrix
     */
    public static FromValuesToRef(initialM11: number, initialM12: number, initialM13: number, initialM14: number,
        initialM21: number, initialM22: number, initialM23: number, initialM24: number,
        initialM31: number, initialM32: number, initialM33: number, initialM34: number,
        initialM41: number, initialM42: number, initialM43: number, initialM44: number, result: Matrix): void {

        const m = result._m;
        m[0] = initialM11; m[1] = initialM12; m[2] = initialM13; m[3] = initialM14;
        m[4] = initialM21; m[5] = initialM22; m[6] = initialM23; m[7] = initialM24;
        m[8] = initialM31; m[9] = initialM32; m[10] = initialM33; m[11] = initialM34;
        m[12] = initialM41; m[13] = initialM42; m[14] = initialM43; m[15] = initialM44;

        result._markAsUpdated();
    }

    /**
     * Creates new matrix from a list of values (16)
     * @param initialM11 defines 1st value of 1st row
     * @param initialM12 defines 2nd value of 1st row
     * @param initialM13 defines 3rd value of 1st row
     * @param initialM14 defines 4th value of 1st row
     * @param initialM21 defines 1st value of 2nd row
     * @param initialM22 defines 2nd value of 2nd row
     * @param initialM23 defines 3rd value of 2nd row
     * @param initialM24 defines 4th value of 2nd row
     * @param initialM31 defines 1st value of 3rd row
     * @param initialM32 defines 2nd value of 3rd row
     * @param initialM33 defines 3rd value of 3rd row
     * @param initialM34 defines 4th value of 3rd row
     * @param initialM41 defines 1st value of 4th row
     * @param initialM42 defines 2nd value of 4th row
     * @param initialM43 defines 3rd value of 4th row
     * @param initialM44 defines 4th value of 4th row
     * @returns the new matrix
     */
    public static FromValues(initialM11: number, initialM12: number, initialM13: number, initialM14: number,
        initialM21: number, initialM22: number, initialM23: number, initialM24: number,
        initialM31: number, initialM32: number, initialM33: number, initialM34: number,
        initialM41: number, initialM42: number, initialM43: number, initialM44: number): Matrix {

        var result = new Matrix();
        const m = result._m;
        m[0] = initialM11; m[1] = initialM12; m[2] = initialM13; m[3] = initialM14;
        m[4] = initialM21; m[5] = initialM22; m[6] = initialM23; m[7] = initialM24;
        m[8] = initialM31; m[9] = initialM32; m[10] = initialM33; m[11] = initialM34;
        m[12] = initialM41; m[13] = initialM42; m[14] = initialM43; m[15] = initialM44;
        result._markAsUpdated();
        return result;
    }

    /**
     * Creates a new matrix composed by merging scale (vector3), rotation (quaternion) and translation (vector3)
     * @param scale defines the scale vector3
     * @param rotation defines the rotation quaternion
     * @param translation defines the translation vector3
     * @returns a new matrix
     */
    public static Compose(scale: DeepImmutable<Vector3>, rotation: DeepImmutable<Quaternion>, translation: DeepImmutable<Vector3>): Matrix {
        var result = new Matrix();
        Matrix.ComposeToRef(scale, rotation, translation, result);
        return result;
    }

    /**
     * Sets a matrix to a value composed by merging scale (vector3), rotation (quaternion) and translation (vector3)
     * @param scale defines the scale vector3
     * @param rotation defines the rotation quaternion
     * @param translation defines the translation vector3
     * @param result defines the target matrix
     */
    public static ComposeToRef(scale: DeepImmutable<Vector3>, rotation: DeepImmutable<Quaternion>, translation: DeepImmutable<Vector3>, result: Matrix): void {
        let m = result._m;
        var x = rotation._x, y = rotation._y, z = rotation._z, w = rotation._w;
        var x2 = x + x, y2 = y + y, z2 = z + z;
        var xx = x * x2, xy = x * y2, xz = x * z2;
        var yy = y * y2, yz = y * z2, zz = z * z2;
        var wx = w * x2, wy = w * y2, wz = w * z2;

        var sx = scale._x, sy = scale._y, sz = scale._z;

        m[0] = (1 - (yy + zz)) * sx;
        m[1] = (xy + wz) * sx;
        m[2] = (xz - wy) * sx;
        m[3] = 0;

        m[4] = (xy - wz) * sy;
        m[5] = (1 - (xx + zz)) * sy;
        m[6] = (yz + wx) * sy;
        m[7] = 0;

        m[8] = (xz + wy) * sz;
        m[9] = (yz - wx) * sz;
        m[10] = (1 - (xx + yy)) * sz;
        m[11] = 0;

        m[12] = translation._x;
        m[13] = translation._y;
        m[14] = translation._z;
        m[15] = 1;

        result._markAsUpdated();
    }

    /**
     * Creates a new identity matrix
     * @returns a new identity matrix
     */
    public static Identity(): Matrix {
        const identity = Matrix.FromValues(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0);
        identity._updateIdentityStatus(true);
        return identity;
    }

    /**
     * Creates a new identity matrix and stores the result in a given matrix
     * @param result defines the target matrix
     */
    public static IdentityToRef(result: Matrix): void {
        Matrix.FromValuesToRef(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );
        result._updateIdentityStatus(true);
    }

    /**
     * Creates a new zero matrix
     * @returns a new zero matrix
     */
    public static Zero(): Matrix {
        const zero = Matrix.FromValues(
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0);
        zero._updateIdentityStatus(false);
        return zero;
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the X axis
     * @param angle defines the angle (in radians) to use
     * @return the new matrix
     */
    public static RotationX(angle: number): Matrix {
        var result = new Matrix();
        Matrix.RotationXToRef(angle, result);
        return result;
    }

    /**
     * Creates a new matrix as the invert of a given matrix
     * @param source defines the source matrix
     * @returns the new matrix
     */
    public static Invert(source: DeepImmutable<Matrix>): Matrix {
        var result = new Matrix();
        source.invertToRef(result);
        return result;
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the X axis and stores it in a given matrix
     * @param angle defines the angle (in radians) to use
     * @param result defines the target matrix
     */
    public static RotationXToRef(angle: number, result: Matrix): void {
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        Matrix.FromValuesToRef(
            1.0, 0.0, 0.0, 0.0,
            0.0, c, s, 0.0,
            0.0, -s, c, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );

        result._updateIdentityStatus(c === 1 && s === 0);
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the Y axis
     * @param angle defines the angle (in radians) to use
     * @return the new matrix
     */
    public static RotationY(angle: number): Matrix {
        var result = new Matrix();
        Matrix.RotationYToRef(angle, result);
        return result;
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the Y axis and stores it in a given matrix
     * @param angle defines the angle (in radians) to use
     * @param result defines the target matrix
     */
    public static RotationYToRef(angle: number, result: Matrix): void {
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        Matrix.FromValuesToRef(
            c, 0.0, -s, 0.0,
            0.0, 1.0, 0.0, 0.0,
            s, 0.0, c, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );

        result._updateIdentityStatus(c === 1 && s === 0);
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the Z axis
     * @param angle defines the angle (in radians) to use
     * @return the new matrix
     */
    public static RotationZ(angle: number): Matrix {
        var result = new Matrix();
        Matrix.RotationZToRef(angle, result);
        return result;
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the Z axis and stores it in a given matrix
     * @param angle defines the angle (in radians) to use
     * @param result defines the target matrix
     */
    public static RotationZToRef(angle: number, result: Matrix): void {
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        Matrix.FromValuesToRef(
            c, s, 0.0, 0.0,
            -s, c, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );

        result._updateIdentityStatus(c === 1 && s === 0);
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the given axis
     * @param axis defines the axis to use
     * @param angle defines the angle (in radians) to use
     * @return the new matrix
     */
    public static RotationAxis(axis: DeepImmutable<Vector3>, angle: number): Matrix {
        var result = new Matrix();
        Matrix.RotationAxisToRef(axis, angle, result);
        return result;
    }

    /**
     * Creates a new rotation matrix for "angle" radians around the given axis and stores it in a given matrix
     * @param axis defines the axis to use
     * @param angle defines the angle (in radians) to use
     * @param result defines the target matrix
     */
    public static RotationAxisToRef(axis: DeepImmutable<Vector3>, angle: number, result: Matrix): void {
        var s = Math.sin(-angle);
        var c = Math.cos(-angle);
        var c1 = 1 - c;

        axis.normalize();
        const m = result._m;
        m[0] = (axis._x * axis._x) * c1 + c;
        m[1] = (axis._x * axis._y) * c1 - (axis._z * s);
        m[2] = (axis._x * axis._z) * c1 + (axis._y * s);
        m[3] = 0.0;

        m[4] = (axis._y * axis._x) * c1 + (axis._z * s);
        m[5] = (axis._y * axis._y) * c1 + c;
        m[6] = (axis._y * axis._z) * c1 - (axis._x * s);
        m[7] = 0.0;

        m[8] = (axis._z * axis._x) * c1 - (axis._y * s);
        m[9] = (axis._z * axis._y) * c1 + (axis._x * s);
        m[10] = (axis._z * axis._z) * c1 + c;
        m[11] = 0.0;

        m[12] = 0.0;
        m[13] = 0.0;
        m[14] = 0.0;
        m[15] = 1.0;

        result._markAsUpdated();
    }

    /**
     * Takes normalised vectors and returns a rotation matrix to align "from" with "to".
     * Taken from http://www.iquilezles.org/www/articles/noacos/noacos.htm
     * @param from defines the vector to align
     * @param to defines the vector to align to
     * @param result defines the target matrix
     */
    public static RotationAlignToRef(from: DeepImmutable<Vector3>, to: DeepImmutable<Vector3>, result: Matrix): void {
        const c = Vector3.Dot(to, from);
        const m = result._m;
        if (c < (-1 + Epsilon))
        {
            // from and to are colinear and opposite direction.
            // compute a PI rotation on Z axis
            m[0] = -1; m[1] =  0; m[2] =  0; m[3] =  0;
            m[4] =  0; m[5] = -1; m[6] =  0; m[7] =  0;
            m[8] =  0; m[9] =  0; m[10] = 1; m[11] = 0;
        }
        else
        {
            const v = Vector3.Cross(to, from);
            const k = 1 / (1 + c);

            m[0] = v._x * v._x * k + c; m[1] = v._y * v._x * k - v._z; m[2] = v._z * v._x * k + v._y; m[3] = 0;
            m[4] = v._x * v._y * k + v._z; m[5] = v._y * v._y * k + c; m[6] = v._z * v._y * k - v._x; m[7] = 0;
            m[8] = v._x * v._z * k - v._y; m[9] = v._y * v._z * k + v._x; m[10] = v._z * v._z * k + c; m[11] = 0;
        }
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
        result._markAsUpdated();
    }

    /**
     * Creates a rotation matrix
     * @param yaw defines the yaw angle in radians (Y axis)
     * @param pitch defines the pitch angle in radians (X axis)
     * @param roll defines the roll angle in radians (Z axis)
     * @returns the new rotation matrix
     */
    public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix {
        var result = new Matrix();
        Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, result);
        return result;
    }

    /**
     * Creates a rotation matrix and stores it in a given matrix
     * @param yaw defines the yaw angle in radians (Y axis)
     * @param pitch defines the pitch angle in radians (X axis)
     * @param roll defines the roll angle in radians (Z axis)
     * @param result defines the target matrix
     */
    public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void {
        Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, MathTmp.Quaternion[0]);
        MathTmp.Quaternion[0].toRotationMatrix(result);
    }

    /**
     * Creates a scaling matrix
     * @param x defines the scale factor on X axis
     * @param y defines the scale factor on Y axis
     * @param z defines the scale factor on Z axis
     * @returns the new matrix
     */
    public static Scaling(x: number, y: number, z: number): Matrix {
        var result = new Matrix();
        Matrix.ScalingToRef(x, y, z, result);
        return result;
    }

    /**
     * Creates a scaling matrix and stores it in a given matrix
     * @param x defines the scale factor on X axis
     * @param y defines the scale factor on Y axis
     * @param z defines the scale factor on Z axis
     * @param result defines the target matrix
     */
    public static ScalingToRef(x: number, y: number, z: number, result: Matrix): void {
        Matrix.FromValuesToRef(
            x, 0.0, 0.0, 0.0,
            0.0, y, 0.0, 0.0,
            0.0, 0.0, z, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );

        result._updateIdentityStatus(x === 1 && y === 1 && z === 1);
    }

    /**
     * Creates a translation matrix
     * @param x defines the translation on X axis
     * @param y defines the translation on Y axis
     * @param z defines the translationon Z axis
     * @returns the new matrix
     */
    public static Translation(x: number, y: number, z: number): Matrix {
        var result = new Matrix();
        Matrix.TranslationToRef(x, y, z, result);
        return result;
    }

    /**
     * Creates a translation matrix and stores it in a given matrix
     * @param x defines the translation on X axis
     * @param y defines the translation on Y axis
     * @param z defines the translationon Z axis
     * @param result defines the target matrix
     */
    public static TranslationToRef(x: number, y: number, z: number, result: Matrix): void {
        Matrix.FromValuesToRef(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            x, y, z, 1.0,
            result
        );
        result._updateIdentityStatus(x === 0 && y === 0 && z === 0);
    }

    /**
     * Returns a new Matrix whose values are the interpolated values for "gradient" (float) between the ones of the matrices "startValue" and "endValue".
     * @param startValue defines the start value
     * @param endValue defines the end value
     * @param gradient defines the gradient factor
     * @returns the new matrix
     */
    public static Lerp(startValue: DeepImmutable<Matrix>, endValue: DeepImmutable<Matrix>, gradient: number): Matrix {
        var result = new Matrix();
        Matrix.LerpToRef(startValue, endValue, gradient, result);
        return result;
    }

    /**
     * Set the given matrix "result" as the interpolated values for "gradient" (float) between the ones of the matrices "startValue" and "endValue".
     * @param startValue defines the start value
     * @param endValue defines the end value
     * @param gradient defines the gradient factor
     * @param result defines the Matrix object where to store data
     */
    public static LerpToRef(startValue: DeepImmutable<Matrix>, endValue: DeepImmutable<Matrix>, gradient: number, result: Matrix): void {
        const resultM = result._m;
        const startM = startValue.m;
        const endM = endValue.m;
        for (var index = 0; index < 16; index++) {
            resultM[index] = startM[index] * (1.0 - gradient) + endM[index] * gradient;
        }
        result._markAsUpdated();
    }

    /**
     * Builds a new matrix whose values are computed by:
     * * decomposing the the "startValue" and "endValue" matrices into their respective scale, rotation and translation matrices
     * * interpolating for "gradient" (float) the values between each of these decomposed matrices between the start and the end
     * * recomposing a new matrix from these 3 interpolated scale, rotation and translation matrices
     * @param startValue defines the first matrix
     * @param endValue defines the second matrix
     * @param gradient defines the gradient between the two matrices
     * @returns the new matrix
     */
    public static DecomposeLerp(startValue: DeepImmutable<Matrix>, endValue: DeepImmutable<Matrix>, gradient: number): Matrix {
        var result = new Matrix();
        Matrix.DecomposeLerpToRef(startValue, endValue, gradient, result);
        return result;
    }

    /**
     * Update a matrix to values which are computed by:
     * * decomposing the the "startValue" and "endValue" matrices into their respective scale, rotation and translation matrices
     * * interpolating for "gradient" (float) the values between each of these decomposed matrices between the start and the end
     * * recomposing a new matrix from these 3 interpolated scale, rotation and translation matrices
     * @param startValue defines the first matrix
     * @param endValue defines the second matrix
     * @param gradient defines the gradient between the two matrices
     * @param result defines the target matrix
     */
    public static DecomposeLerpToRef(startValue: DeepImmutable<Matrix>, endValue: DeepImmutable<Matrix>, gradient: number, result: Matrix) {
        var startScale = MathTmp.Vector3[0];
        var startRotation = MathTmp.Quaternion[0];
        var startTranslation = MathTmp.Vector3[1];
        startValue.decompose(startScale, startRotation, startTranslation);

        var endScale = MathTmp.Vector3[2];
        var endRotation = MathTmp.Quaternion[1];
        var endTranslation = MathTmp.Vector3[3];
        endValue.decompose(endScale, endRotation, endTranslation);

        var resultScale = MathTmp.Vector3[4];
        Vector3.LerpToRef(startScale, endScale, gradient, resultScale);
        var resultRotation = MathTmp.Quaternion[2];
        Quaternion.SlerpToRef(startRotation, endRotation, gradient, resultRotation);

        var resultTranslation = MathTmp.Vector3[5];
        Vector3.LerpToRef(startTranslation, endTranslation, gradient, resultTranslation);

        Matrix.ComposeToRef(resultScale, resultRotation, resultTranslation, result);
    }

    /**
     * Gets a new rotation matrix used to rotate an entity so as it looks at the target vector3, from the eye vector3 position, the up vector3 being oriented like "up"
     * This function works in left handed mode
     * @param eye defines the final position of the entity
     * @param target defines where the entity should look at
     * @param up defines the up vector for the entity
     * @returns the new matrix
     */
    public static LookAtLH(eye: DeepImmutable<Vector3>, target: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>): Matrix {
        var result = new Matrix();
        Matrix.LookAtLHToRef(eye, target, up, result);
        return result;
    }

    /**
     * Sets the given "result" Matrix to a rotation matrix used to rotate an entity so that it looks at the target vector3, from the eye vector3 position, the up vector3 being oriented like "up".
     * This function works in left handed mode
     * @param eye defines the final position of the entity
     * @param target defines where the entity should look at
     * @param up defines the up vector for the entity
     * @param result defines the target matrix
     */
    public static LookAtLHToRef(eye: DeepImmutable<Vector3>, target: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>, result: Matrix): void {
        const xAxis = MathTmp.Vector3[0];
        const yAxis = MathTmp.Vector3[1];
        const zAxis = MathTmp.Vector3[2];

        // Z axis
        target.subtractToRef(eye, zAxis);
        zAxis.normalize();

        // X axis
        Vector3.CrossToRef(up, zAxis, xAxis);

        const xSquareLength = xAxis.lengthSquared();
        if (xSquareLength === 0) {
            xAxis.x = 1.0;
        } else {
            xAxis.normalizeFromLength(Math.sqrt(xSquareLength));
        }

        // Y axis
        Vector3.CrossToRef(zAxis, xAxis, yAxis);
        yAxis.normalize();

        // Eye angles
        var ex = -Vector3.Dot(xAxis, eye);
        var ey = -Vector3.Dot(yAxis, eye);
        var ez = -Vector3.Dot(zAxis, eye);

        Matrix.FromValuesToRef(
            xAxis._x, yAxis._x, zAxis._x, 0.0,
            xAxis._y, yAxis._y, zAxis._y, 0.0,
            xAxis._z, yAxis._z, zAxis._z, 0.0,
            ex, ey, ez, 1.0,
            result
        );
    }

    /**
     * Gets a new rotation matrix used to rotate an entity so as it looks at the target vector3, from the eye vector3 position, the up vector3 being oriented like "up"
     * This function works in right handed mode
     * @param eye defines the final position of the entity
     * @param target defines where the entity should look at
     * @param up defines the up vector for the entity
     * @returns the new matrix
     */
    public static LookAtRH(eye: DeepImmutable<Vector3>, target: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>): Matrix {
        var result = new Matrix();
        Matrix.LookAtRHToRef(eye, target, up, result);
        return result;
    }

    /**
     * Sets the given "result" Matrix to a rotation matrix used to rotate an entity so that it looks at the target vector3, from the eye vector3 position, the up vector3 being oriented like "up".
     * This function works in right handed mode
     * @param eye defines the final position of the entity
     * @param target defines where the entity should look at
     * @param up defines the up vector for the entity
     * @param result defines the target matrix
     */
    public static LookAtRHToRef(eye: DeepImmutable<Vector3>, target: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>, result: Matrix): void {
        const xAxis = MathTmp.Vector3[0];
        const yAxis = MathTmp.Vector3[1];
        const zAxis = MathTmp.Vector3[2];

        // Z axis
        eye.subtractToRef(target, zAxis);
        zAxis.normalize();

        // X axis
        Vector3.CrossToRef(up, zAxis, xAxis);

        const xSquareLength = xAxis.lengthSquared();
        if (xSquareLength === 0) {
            xAxis.x = 1.0;
        } else {
            xAxis.normalizeFromLength(Math.sqrt(xSquareLength));
        }

        // Y axis
        Vector3.CrossToRef(zAxis, xAxis, yAxis);
        yAxis.normalize();

        // Eye angles
        var ex = -Vector3.Dot(xAxis, eye);
        var ey = -Vector3.Dot(yAxis, eye);
        var ez = -Vector3.Dot(zAxis, eye);

        Matrix.FromValuesToRef(
            xAxis._x, yAxis._x, zAxis._x, 0.0,
            xAxis._y, yAxis._y, zAxis._y, 0.0,
            xAxis._z, yAxis._z, zAxis._z, 0.0,
            ex, ey, ez, 1.0,
            result
        );
    }

    /**
     * Gets a new rotation matrix used to rotate an entity so as it looks in the direction specified by forward from the eye position, the up direction being oriented like "up".
     * This function works in left handed mode
     * @param forward defines the forward direction - Must be normalized and orthogonal to up.
     * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
     * @returns the new matrix
     */
    public static LookDirectionLH(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>): Matrix {
        var result = new Matrix();
        Matrix.LookDirectionLHToRef(forward, up, result);
        return result;
    }

    /**
     * Sets the given "result" Matrix to a rotation matrix used to rotate an entity so that it looks in the direction of forward, the up direction being oriented like "up".
     * This function works in left handed mode
     * @param forward defines the forward direction - Must be normalized and orthogonal to up.
     * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
     * @param result defines the target matrix
     */
    public static LookDirectionLHToRef(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>, result: Matrix): void {
        const back = MathTmp.Vector3[0];
        back.copyFrom(forward);
        back.scaleInPlace(-1);
        const left = MathTmp.Vector3[1];
        Vector3.CrossToRef(up, back, left);

        // Generate the rotation matrix.
        Matrix.FromValuesToRef(
            left._x, left._y, left._z, 0.0,
            up._x, up._y, up._z, 0.0,
            back._x, back._y, back._z, 0.0,
            0, 0, 0, 1.0,
            result
        );
    }

    /**
    * Gets a new rotation matrix used to rotate an entity so as it looks in the direction specified by forward from the eye position, the up Vector3 being oriented like "up".
    * This function works in right handed mode
    * @param forward defines the forward direction - Must be normalized and orthogonal to up.
    * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
    * @returns the new matrix
    */
    public static LookDirectionRH(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>): Matrix {
        var result = new Matrix();
        Matrix.LookDirectionRHToRef(forward, up, result);
        return result;
    }

    /**
     * Sets the given "result" Matrix to a rotation matrix used to rotate an entity so that it looks in the direction of forward, the up vector3 being oriented like "up".
     * This function works in right handed mode
     * @param forward defines the forward direction - Must be normalized and orthogonal to up.
     * @param up defines the up vector for the entity - Must be normalized and orthogonal to forward.
     * @param result defines the target matrix
     */
    public static LookDirectionRHToRef(forward: DeepImmutable<Vector3>, up: DeepImmutable<Vector3>, result: Matrix): void {
        const right = MathTmp.Vector3[2];
        Vector3.CrossToRef(up, forward, right);

        // Generate the rotation matrix.
        Matrix.FromValuesToRef(
            right._x, right._y, right._z, 0.0,
            up._x, up._y, up._z, 0.0,
            forward._x, forward._y, forward._z, 0.0,
            0, 0, 0, 1.0,
            result
        );
    }

    /**
     * Create a left-handed orthographic projection matrix
     * @param width defines the viewport width
     * @param height defines the viewport height
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @returns a new matrix as a left-handed orthographic projection matrix
     */
    public static OrthoLH(width: number, height: number, znear: number, zfar: number, halfZRange?: boolean): Matrix {
        var matrix = new Matrix();
        Matrix.OrthoLHToRef(width, height, znear, zfar, matrix, halfZRange);
        return matrix;
    }

    /**
     * Store a left-handed orthographic projection to a given matrix
     * @param width defines the viewport width
     * @param height defines the viewport height
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param result defines the target matrix
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     */
    public static OrthoLHToRef(width: number, height: number, znear: number, zfar: number, result: Matrix, halfZRange?: boolean): void {
        let n = znear;
        let f = zfar;

        let a = 2.0 / width;
        let b = 2.0 / height;
        let c = 2.0 / (f - n);
        let d = -(f + n) / (f - n);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, 0.0,
            0.0, 0.0, c, 0.0,
            0.0, 0.0, d, 1.0,
            result
        );

        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }

        result._updateIdentityStatus(a === 1 && b === 1 && c === 1 && d === 0);
    }

    /**
     * Create a left-handed orthographic projection matrix
     * @param left defines the viewport left coordinate
     * @param right defines the viewport right coordinate
     * @param bottom defines the viewport bottom coordinate
     * @param top defines the viewport top coordinate
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @returns a new matrix as a left-handed orthographic projection matrix
     */
    public static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, halfZRange?: boolean): Matrix {
        var matrix = new Matrix();
        Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, matrix, halfZRange);
        return matrix;
    }

    /**
     * Stores a left-handed orthographic projection into a given matrix
     * @param left defines the viewport left coordinate
     * @param right defines the viewport right coordinate
     * @param bottom defines the viewport bottom coordinate
     * @param top defines the viewport top coordinate
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param result defines the target matrix
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     */
    public static OrthoOffCenterLHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix, halfZRange?: boolean): void {
        let n = znear;
        let f = zfar;

        let a = 2.0 / (right - left);
        let b = 2.0 / (top - bottom);
        let c = 2.0 / (f - n);
        let d = -(f + n) / (f - n);
        let i0 = (left + right) / (left - right);
        let i1 = (top + bottom) / (bottom - top);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, 0.0,
            0.0, 0.0, c, 0.0,
            i0, i1, d, 1.0,
            result
        );

        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }

        result._markAsUpdated();
    }

    /**
     * Creates a right-handed orthographic projection matrix
     * @param left defines the viewport left coordinate
     * @param right defines the viewport right coordinate
     * @param bottom defines the viewport bottom coordinate
     * @param top defines the viewport top coordinate
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @returns a new matrix as a right-handed orthographic projection matrix
     */
    public static OrthoOffCenterRH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, halfZRange?: boolean): Matrix {
        var matrix = new Matrix();
        Matrix.OrthoOffCenterRHToRef(left, right, bottom, top, znear, zfar, matrix, halfZRange);
        return matrix;
    }

    /**
     * Stores a right-handed orthographic projection into a given matrix
     * @param left defines the viewport left coordinate
     * @param right defines the viewport right coordinate
     * @param bottom defines the viewport bottom coordinate
     * @param top defines the viewport top coordinate
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param result defines the target matrix
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     */
    public static OrthoOffCenterRHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix, halfZRange?: boolean): void {
        Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, result, halfZRange);
        result._m[10] *= -1; // No need to call _markAsUpdated as previous function already called it and let _isIdentityDirty to true
    }

    /**
     * Creates a left-handed perspective projection matrix
     * @param width defines the viewport width
     * @param height defines the viewport height
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     * @returns a new matrix as a left-handed perspective projection matrix
     */
    public static PerspectiveLH(width: number, height: number, znear: number, zfar: number, halfZRange?: boolean, projectionPlaneTilt: number = 0): Matrix {
        var matrix = new Matrix();

        let n = znear;
        let f = zfar;

        let a = 2.0 * n / width;
        let b = 2.0 * n / height;
        let c = (f + n) / (f - n);
        let d = -2.0 * f * n / (f - n);
        let rot = Math.tan(projectionPlaneTilt);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, rot,
            0.0, 0.0, c, 1.0,
            0.0, 0.0, d, 0.0,
            matrix
        );

        if (halfZRange) {
            matrix.multiplyToRef(mtxConvertNDCToHalfZRange, matrix);
        }

        matrix._updateIdentityStatus(false);
        return matrix;
    }

    /**
     * Creates a left-handed perspective projection matrix
     * @param fov defines the horizontal field of view
     * @param aspect defines the aspect ratio
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     * @returns a new matrix as a left-handed perspective projection matrix
     */
    public static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number, halfZRange?: boolean, projectionPlaneTilt: number = 0): Matrix {
        var matrix = new Matrix();
        Matrix.PerspectiveFovLHToRef(fov, aspect, znear, zfar, matrix, true, halfZRange, projectionPlaneTilt);
        return matrix;
    }

    /**
     * Stores a left-handed perspective projection into a given matrix
     * @param fov defines the horizontal field of view
     * @param aspect defines the aspect ratio
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param result defines the target matrix
     * @param isVerticalFovFixed defines it the fov is vertically fixed (default) or horizontally
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     */
    public static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true, halfZRange?: boolean, projectionPlaneTilt: number = 0): void {
        let n = znear;
        let f = zfar;

        let t = 1.0 / (Math.tan(fov * 0.5));
        let a = isVerticalFovFixed ? (t / aspect) : t;
        let b = isVerticalFovFixed ? t : (t * aspect);
        let c = f !== 0 ? (f + n) / (f - n) : 1;
        let d = f !== 0 ? -2.0 * f * n / (f - n) : -2 * n;
        let rot = Math.tan(projectionPlaneTilt);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, rot,
            0.0, 0.0, c, 1.0,
            0.0, 0.0, d, 0.0,
            result
        );

        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }

        result._updateIdentityStatus(false);
    }

    /**
     * Stores a left-handed perspective projection into a given matrix with depth reversed
     * @param fov defines the horizontal field of view
     * @param aspect defines the aspect ratio
     * @param znear defines the near clip plane
     * @param zfar not used as infinity is used as far clip
     * @param result defines the target matrix
     * @param isVerticalFovFixed defines it the fov is vertically fixed (default) or horizontally
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     */
    public static PerspectiveFovReverseLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true, halfZRange?: boolean, projectionPlaneTilt: number = 0): void {
        let t = 1.0 / (Math.tan(fov * 0.5));
        let a = isVerticalFovFixed ? (t / aspect) : t;
        let b = isVerticalFovFixed ? t : (t * aspect);
        let rot = Math.tan(projectionPlaneTilt);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, rot,
            0.0, 0.0, -znear, 1.0,
            0.0, 0.0, 1.0, 0.0,
            result
        );
        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }
        result._updateIdentityStatus(false);
    }

    /**
     * Creates a right-handed perspective projection matrix
     * @param fov defines the horizontal field of view
     * @param aspect defines the aspect ratio
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     * @returns a new matrix as a right-handed perspective projection matrix
     */
    public static PerspectiveFovRH(fov: number, aspect: number, znear: number, zfar: number, halfZRange?: boolean, projectionPlaneTilt: number = 0): Matrix {
        var matrix = new Matrix();
        Matrix.PerspectiveFovRHToRef(fov, aspect, znear, zfar, matrix, true, halfZRange, projectionPlaneTilt);
        return matrix;
    }

    /**
     * Stores a right-handed perspective projection into a given matrix
     * @param fov defines the horizontal field of view
     * @param aspect defines the aspect ratio
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param result defines the target matrix
     * @param isVerticalFovFixed defines it the fov is vertically fixed (default) or horizontally
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     */
    public static PerspectiveFovRHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true, halfZRange?: boolean, projectionPlaneTilt: number = 0): void {
        //alternatively this could be expressed as:
        //    m = PerspectiveFovLHToRef
        //    m[10] *= -1.0;
        //    m[11] *= -1.0;

        let n = znear;
        let f = zfar;

        let t = 1.0 / (Math.tan(fov * 0.5));
        let a = isVerticalFovFixed ? (t / aspect) : t;
        let b = isVerticalFovFixed ? t : (t * aspect);
        let c = f !== 0 ? -(f + n) / (f - n) : -1;
        let d = f !== 0 ? -2 * f * n / (f - n) : -2 * n;
        let rot = Math.tan(projectionPlaneTilt);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, rot,
            0.0, 0.0, c, -1.0,
            0.0, 0.0, d, 0.0,
            result
        );

        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }

        result._updateIdentityStatus(false);
    }

    /**
     * Stores a right-handed perspective projection into a given matrix
     * @param fov defines the horizontal field of view
     * @param aspect defines the aspect ratio
     * @param znear defines the near clip plane
     * @param zfar not used as infinity is used as far clip
     * @param result defines the target matrix
     * @param isVerticalFovFixed defines it the fov is vertically fixed (default) or horizontally
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     */
    public static PerspectiveFovReverseRHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true, halfZRange?: boolean, projectionPlaneTilt: number = 0): void {
        let t = 1.0 / (Math.tan(fov * 0.5));
        let a = isVerticalFovFixed ? (t / aspect) : t;
        let b = isVerticalFovFixed ? t : (t * aspect);
        let rot = Math.tan(projectionPlaneTilt);

        Matrix.FromValuesToRef(
            a, 0.0, 0.0, 0.0,
            0.0, b, 0.0, rot,
            0.0, 0.0, -znear, -1.0,
            0.0, 0.0, -1.0, 0.0,
            result
        );

        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }

        result._updateIdentityStatus(false);
    }

    /**
     * Stores a perspective projection for WebVR info a given matrix
     * @param fov defines the field of view
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @param result defines the target matrix
     * @param rightHanded defines if the matrix must be in right-handed mode (false by default)
     * @param halfZRange true to generate NDC coordinates between 0 and 1 instead of -1 and 1 (default: false)
     * @param projectionPlaneTilt optional tilt angle of the projection plane around the X axis (horizontal)
     */
    public static PerspectiveFovWebVRToRef(fov: { upDegrees: number, downDegrees: number, leftDegrees: number, rightDegrees: number }, znear: number, zfar: number, result: Matrix, rightHanded = false, halfZRange?: boolean, projectionPlaneTilt: number = 0): void {

        var rightHandedFactor = rightHanded ? -1 : 1;

        var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
        var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
        var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
        var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
        var xScale = 2.0 / (leftTan + rightTan);
        var yScale = 2.0 / (upTan + downTan);
        let rot = Math.tan(projectionPlaneTilt);

        const m = result._m;
        m[0] = xScale;
        m[1] = m[2] = m[3] = m[4] = 0.0;
        m[5] = yScale;
        m[6] = 0.0;
        m[7] = rot;
        m[8] = ((leftTan - rightTan) * xScale * 0.5);
        m[9] = -((upTan - downTan) * yScale * 0.5);
        m[10] = -zfar / (znear - zfar);
        m[11] = 1.0 * rightHandedFactor;
        m[12] = m[13] = m[15] = 0.0;
        m[14] = -(2.0 * zfar * znear) / (zfar - znear);

        if (halfZRange) {
            result.multiplyToRef(mtxConvertNDCToHalfZRange, result);
        }

        result._markAsUpdated();
    }

    /**
     * Computes a complete transformation matrix
     * @param viewport defines the viewport to use
     * @param world defines the world matrix
     * @param view defines the view matrix
     * @param projection defines the projection matrix
     * @param zmin defines the near clip plane
     * @param zmax defines the far clip plane
     * @returns the transformation matrix
     */
    public static GetFinalMatrix(viewport: DeepImmutable<Viewport>, world: DeepImmutable<Matrix>, view: DeepImmutable<Matrix>, projection: DeepImmutable<Matrix>, zmin: number, zmax: number): Matrix {
        var cw = viewport.width;
        var ch = viewport.height;
        var cx = viewport.x;
        var cy = viewport.y;

        var viewportMatrix = Matrix.FromValues(
            cw / 2.0, 0.0, 0.0, 0.0,
            0.0, -ch / 2.0, 0.0, 0.0,
            0.0, 0.0, zmax - zmin, 0.0,
            cx + cw / 2.0, ch / 2.0 + cy, zmin, 1.0);

        var matrix = MathTmp.Matrix[0];
        world.multiplyToRef(view, matrix);
        matrix.multiplyToRef(projection, matrix);
        return matrix.multiply(viewportMatrix);
    }

    /**
     * Extracts a 2x2 matrix from a given matrix and store the result in a Float32Array
     * @param matrix defines the matrix to use
     * @returns a new Float32Array array with 4 elements : the 2x2 matrix extracted from the given matrix
     */
    public static GetAsMatrix2x2(matrix: DeepImmutable<Matrix>): Float32Array | Array<number> {
        const m = matrix.m;
        const arr = [m[0], m[1], m[4], m[5]];
        return PerformanceConfigurator.MatrixUse64Bits ? arr : new Float32Array(arr);
    }
    /**
     * Extracts a 3x3 matrix from a given matrix and store the result in a Float32Array
     * @param matrix defines the matrix to use
     * @returns a new Float32Array array with 9 elements : the 3x3 matrix extracted from the given matrix
     */
    public static GetAsMatrix3x3(matrix: DeepImmutable<Matrix>): Float32Array | Array<number> {
        const m = matrix.m;
        const arr = [
            m[0], m[1], m[2],
            m[4], m[5], m[6],
            m[8], m[9], m[10]
        ];
        return PerformanceConfigurator.MatrixUse64Bits ? arr : new Float32Array(arr);
    }

    /**
     * Compute the transpose of a given matrix
     * @param matrix defines the matrix to transpose
     * @returns the new matrix
     */
    public static Transpose(matrix: DeepImmutable<Matrix>): Matrix {
        var result = new Matrix();
        Matrix.TransposeToRef(matrix, result);
        return result;
    }

    /**
     * Compute the transpose of a matrix and store it in a target matrix
     * @param matrix defines the matrix to transpose
     * @param result defines the target matrix
     */
    public static TransposeToRef(matrix: DeepImmutable<Matrix>, result: Matrix): void {
        const rm = result._m;
        const mm = matrix.m;
        rm[0] = mm[0];
        rm[1] = mm[4];
        rm[2] = mm[8];
        rm[3] = mm[12];

        rm[4] = mm[1];
        rm[5] = mm[5];
        rm[6] = mm[9];
        rm[7] = mm[13];

        rm[8] = mm[2];
        rm[9] = mm[6];
        rm[10] = mm[10];
        rm[11] = mm[14];

        rm[12] = mm[3];
        rm[13] = mm[7];
        rm[14] = mm[11];
        rm[15] = mm[15];
        // identity-ness does not change when transposing
        result._updateIdentityStatus((matrix as Matrix)._isIdentity, (matrix as Matrix)._isIdentityDirty);
    }

    /**
     * Computes a reflection matrix from a plane
     * @param plane defines the reflection plane
     * @returns a new matrix
     */
    public static Reflection(plane: DeepImmutable<IPlaneLike>): Matrix {
        var matrix = new Matrix();
        Matrix.ReflectionToRef(plane, matrix);
        return matrix;
    }

    /**
     * Computes a reflection matrix from a plane
     * @param plane defines the reflection plane
     * @param result defines the target matrix
     */
    public static ReflectionToRef(plane: DeepImmutable<IPlaneLike>, result: Matrix): void {
        plane.normalize();
        var x = plane.normal.x;
        var y = plane.normal.y;
        var z = plane.normal.z;
        var temp = -2 * x;
        var temp2 = -2 * y;
        var temp3 = -2 * z;
        Matrix.FromValuesToRef(
            temp * x + 1, temp2 * x, temp3 * x, 0.0,
            temp * y, temp2 * y + 1, temp3 * y, 0.0,
            temp * z, temp2 * z, temp3 * z + 1, 0.0,
            temp * plane.d, temp2 * plane.d, temp3 * plane.d, 1.0,
            result
        );
    }

    /**
     * Sets the given matrix as a rotation matrix composed from the 3 left handed axes
     * @param xaxis defines the value of the 1st axis
     * @param yaxis defines the value of the 2nd axis
     * @param zaxis defines the value of the 3rd axis
     * @param result defines the target matrix
     */
    public static FromXYZAxesToRef(xaxis: DeepImmutable<Vector3>, yaxis: DeepImmutable<Vector3>, zaxis: DeepImmutable<Vector3>, result: Matrix) {
        Matrix.FromValuesToRef(
            xaxis._x, xaxis._y, xaxis._z, 0.0,
            yaxis._x, yaxis._y, yaxis._z, 0.0,
            zaxis._x, zaxis._y, zaxis._z, 0.0,
            0.0, 0.0, 0.0, 1.0,
            result
        );
    }

    /**
     * Creates a rotation matrix from a quaternion and stores it in a target matrix
     * @param quat defines the quaternion to use
     * @param result defines the target matrix
     */
    public static FromQuaternionToRef(quat: DeepImmutable<Quaternion>, result: Matrix) {
        var xx = quat._x * quat._x;
        var yy = quat._y * quat._y;
        var zz = quat._z * quat._z;
        var xy = quat._x * quat._y;
        var zw = quat._z * quat._w;
        var zx = quat._z * quat._x;
        var yw = quat._y * quat._w;
        var yz = quat._y * quat._z;
        var xw = quat._x * quat._w;

        result._m[0] = 1.0 - (2.0 * (yy + zz));
        result._m[1] = 2.0 * (xy + zw);
        result._m[2] = 2.0 * (zx - yw);
        result._m[3] = 0.0;

        result._m[4] = 2.0 * (xy - zw);
        result._m[5] = 1.0 - (2.0 * (zz + xx));
        result._m[6] = 2.0 * (yz + xw);
        result._m[7] = 0.0;

        result._m[8] = 2.0 * (zx + yw);
        result._m[9] = 2.0 * (yz - xw);
        result._m[10] = 1.0 - (2.0 * (yy + xx));
        result._m[11] = 0.0;

        result._m[12] = 0.0;
        result._m[13] = 0.0;
        result._m[14] = 0.0;
        result._m[15] = 1.0;

        result._markAsUpdated();
    }
}

/**
 * @hidden
 * Same as Tmp but not exported to keep it only for math functions to avoid conflicts
 */
class MathTmp {
    public static Vector3: Vector3[] = ArrayTools.BuildArray(11, Vector3.Zero);
    public static Matrix: Matrix[] = ArrayTools.BuildArray(2, Matrix.Identity);
    public static Quaternion: Quaternion[] = ArrayTools.BuildArray(3, Quaternion.Zero);
}

/**
 * @hidden
 */
export class TmpVectors {
    public static Vector2: Vector2[] = ArrayTools.BuildArray(3, Vector2.Zero); // 3 temp Vector2 at once should be enough
    public static Vector3: Vector3[] = ArrayTools.BuildArray(13, Vector3.Zero); // 13 temp Vector3 at once should be enough
    public static Vector4: Vector4[] = ArrayTools.BuildArray(3, Vector4.Zero); // 3 temp Vector4 at once should be enough
    public static Quaternion: Quaternion[] = ArrayTools.BuildArray(2, Quaternion.Zero); // 2 temp Quaternion at once should be enough
    public static Matrix: Matrix[] = ArrayTools.BuildArray(8, Matrix.Identity); // 8 temp Matrices at once should be enough
}

_TypeStore.RegisteredTypes["BABYLON.Vector2"] = Vector2;
_TypeStore.RegisteredTypes["BABYLON.Vector3"] = Vector3;
_TypeStore.RegisteredTypes["BABYLON.Vector4"] = Vector4;
_TypeStore.RegisteredTypes["BABYLON.Matrix"] = Matrix;

const mtxConvertNDCToHalfZRange = Matrix.FromValues(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 0.5, 0,
    0, 0, 0.5, 1
);
