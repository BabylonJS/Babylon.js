import type { DeepImmutable, Flatten, FloatArray, Length, Tuple } from "../types";
/**
 * Computes the tensor dimension of a multi-dimensional array
 */
export type Dimension<T> = T extends Array<infer U> ? [Length<T>, ...Dimension<U>] : T extends readonly [infer U, ...infer R] ? [Length<T>, ...Dimension<U>] : [];

/**
 * Possible values for a Tensor
 */
export type TensorValue = number[] | TensorValue[];

/**
 * Extracts the value type of a Tensor
 */
export type ValueOfTensor<T = unknown> = T extends Tensor<infer V, any> ? V : TensorValue;

type TensorNumberArray<V extends TensorValue> = Length<Dimension<V>> extends 2 ? Tuple<number, 16> : V;

export type TensorLike<T> = T extends Tensor<TensorValue, infer I> ? I : never;

/**
 * Describes a mathematical tensor.
 * @see https://wikipedia.org/wiki/Tensor
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Tensor<V extends TensorValue, I> {
    /**
     * An array of the size of each dimension.
     * For example, [3] for a Vector3 and [4,4] for a Matrix
     * @remarks
     * This is to allow implementations with using a getter
     */
    readonly dimension: Readonly<Dimension<V>>;

    /**
     * The rank of the tensor. This is the same as the length of the tensor's dimension array.
     * @remarks
     * This is to allow implementations with using a getter
     */
    readonly rank: number;

    /**
     * Gets class name
     * @returns the class name
     */

    getClassName(): string;

    /**
     * Gets current instance hash code
     * @returns the instance hash code as a number
     */
    getHashCode(): number;

    /**
     * Sets the instance coordinates in the given array from the given index.
     * @param array defines the source array
     * @param index defines the offset in source array
     * @returns the current instance
     */
    toArray(array: FloatArray, index?: number): this;

    /**
     * Update the current instance from an array
     * @param array defines the destination array
     * @param index defines the offset in the destination array
     * @returns the current instance
     */
    fromArray(array: DeepImmutable<FloatArray>, index?: number): this;

    /**
     * Copy the current instance to an array
     * @returns a new array with the instance coordinates.
     */
    asArray(): TensorNumberArray<V>;

    /**
     * Sets the current instance coordinates with the given source coordinates
     * @param source defines the source instance
     * @returns the current updated instance
     */
    copyFrom(source: DeepImmutable<I>): this;

    /**
     * Sets the instance coordinates with the given floats
     * @returns the current updated instance
     */

    copyFromFloats(...floats: TensorNumberArray<V>): this;

    /**
     * Sets the instance coordinates with the given floats
     * @returns the current updated instance
     */
    set(...values: TensorNumberArray<V>): this;

    /**
     * Sets the instance coordinates to the given value
     * @returns the current updated instance
     */
    setAll(value: number): this;

    /**
     * Add another instance with the current one
     * @param other defines the other instance
     * @returns a new instance set with the addition of the current instance and the given one coordinates
     */
    add(other: DeepImmutable<I>): Tensor<V, I>;

    /**
     * Sets the "result" coordinates with the addition of the current instance and the given one coordinates
     * @param other defines the other instance
     * @param result defines the target instance
     * @returns result input
     */
    addToRef<R extends I>(other: DeepImmutable<I>, result: R): R;

    /**
     * Set the instance coordinates by adding the given instance coordinates
     * @param other defines the other instance
     * @returns the current updated instance
     */
    addInPlace(other: DeepImmutable<I>): this;

    /**
     * Adds the given coordinates to the current instance
     * @param floats the floats to add
     * @returns the current updated instance
     */
    addInPlaceFromFloats(...floats: TensorNumberArray<V>): this;

    /**
     * Returns a new instance set with the subtracted coordinates of other's coordinates from the current coordinates.
     * @param other defines the other instance
     * @returns a new instance
     */
    subtract(other: DeepImmutable<I>): Tensor<V, I>;

    /**
     * Sets the "result" coordinates with the subtraction of the other's coordinates from the current coordinates.
     * @param other defines the other instance
     * @param result defines the target instance
     * @returns result input
     */
    subtractToRef<R extends I>(other: DeepImmutable<I>, result: R): R;

    /**
     * Sets the current instance coordinates by subtracting from it the given one coordinates
     * @param other defines the other instance
     * @returns the current updated instance
     */
    subtractInPlace(other: DeepImmutable<I>): this;

    /**
     * Returns a new instance set with the subtraction of the given floats from the current instance coordinates
     * @param floats the coordinates to subtract
     * @returns the resulting instance
     */
    subtractFromFloats(...floats: TensorNumberArray<V>): Tensor<V, I>;

    /**
     * Subtracts the given floats from the current instance coordinates and set the given instance "result" with this result
     * Note: Implementation uses array magic so types may be confusing.
     * @param args the coordinates to subtract with the last element as the result
     * @returns the result
     */
    subtractFromFloatsToRef<R extends I>(...args: [...TensorNumberArray<V>, R]): R;

    /**
     * Returns a new instance set with the multiplication of the current instance and the given one coordinates
     * @param other defines the other instance
     * @returns a new instance
     */
    multiply(other: DeepImmutable<I>): Tensor<V, I>;

    /**
     * Sets "result" coordinates with the multiplication of the current instance and the given one coordinates
     * @param other defines the other instance
     * @param result defines the target instance
     * @returns result input
     */
    multiplyToRef<R extends I>(other: DeepImmutable<I>, result: R): R;

    /**
     * Multiplies in place the current instance coordinates by the given ones
     * @param other defines the other instance
     * @returns the current updated instance
     */
    multiplyInPlace(other: DeepImmutable<I>): this;

    /**
     * Gets a new instance set with the instance coordinates multiplied by the given floats
     * @returns a new instance
     */
    multiplyByFloats(...floats: TensorNumberArray<V>): Tensor<V, I>;

    /**
     * Returns a new instance set with the instance coordinates divided by the given one coordinates
     * @param other defines the other instance
     * @returns a new instance
     */
    divide(other: DeepImmutable<I>): Tensor<V, I>;

    /**
     * Sets the "result" coordinates with the instance coordinates divided by the given one coordinates
     * @param other defines the other instance
     * @param result defines the target instance
     * @returns result input
     */
    divideToRef<R extends I>(other: DeepImmutable<I>, result: R): R;

    /**
     * Divides the current instance coordinates by the given ones
     * @param other defines the other instance
     * @returns the current updated instance
     */
    divideInPlace(other: DeepImmutable<I>): this;

    /**
     * Updates the current instance with the minmal coordinate values between its and the given instance ones.
     * @param other defines the other instance
     * @returns this current updated instance
     */
    minimizeInPlace(other: DeepImmutable<I>): this;

    /**
     * Updates the current instance with the minmal coordinate values between its and the given floats.
     * @param floats defines the floats to compare against
     * @returns this current updated instance
     */
    minimizeInPlaceFromFloats(...floats: TensorNumberArray<V>): this;

    /**
     * Updates the current instance with the maximal coordinate values between its and the given instance ones.
     * @param other defines the other instance
     * @returns this current updated instance
     */
    maximizeInPlace(other: DeepImmutable<I>): this;

    /**
     * Updates the current instance with the maximal coordinate values between its and the given floats.
     * @param floats defines the floats to compare against
     * @returns this current updated instance
     */
    maximizeInPlaceFromFloats(...floats: TensorNumberArray<V>): this;

    /**
     * Gets a new instance with current instance negated coordinates
     * @returns a new instance
     */
    negate(): Tensor<V, I>;

    /**
     * Negate this instance in place
     * @returns this
     */
    negateInPlace(): this;

    /**
     * Negate the current instance and stores the result in the given instance "result" coordinates
     * @param result defines the instance object where to store the result
     * @returns the result
     */
    negateToRef<R extends I>(result: R): R;

    /**
     * Multiply the instance coordinates by
     * @param scale defines the scaling factor
     * @returns the current updated instance
     */
    scaleInPlace(scale: number): this;

    /**
     * Returns a new instance scaled by "scale" from the current instance
     * @param scale defines the scaling factor
     * @returns a new instance
     */
    scale(scale: number): Tensor<V, I>;

    /**
     * Scale the current instance values by a factor to a given instance
     * @param scale defines the scale factor
     * @param result defines the instance object where to store the result
     * @returns result input
     */
    scaleToRef<R extends I>(scale: number, result: R): R;

    /**
     * Scale the current instance values by a factor and add the result to a given instance
     * @param scale defines the scale factor
     * @param result defines the instance object where to store the result
     * @returns result input
     */
    scaleAndAddToRef<R extends I>(scale: number, result: R): R;

    /**
     * Gets a boolean if two instances are equals
     * @param other defines the other instance
     * @returns true if the given instance coordinates strictly equal the current instance ones
     */
    equals(other: DeepImmutable<I>): boolean;

    /**
     * Gets a boolean if two instances are equals (using an epsilon value)
     * @param other defines the other instance
     * @param epsilon defines the minimal distance to consider equality
     * @returns true if the given instance coordinates are close to the current ones by a distance of epsilon.
     */
    equalsWithEpsilon(other: DeepImmutable<I>, epsilon?: number): boolean;

    /**
     * Returns true if the current Vectoe coordinates equals the given floats
     * @param floats defines the coordinates to compare against
     * @returns true if both instances are equal
     */
    equalsToFloats(...floats: TensorNumberArray<V>): boolean;

    /**
     * Gets a new instance from current instance floored values
     * eg (1.2, 2.31) returns (1, 2)
     * @returns a new instance
     */
    floor(): Tensor<V, I>;

    /**
     * Gets the current instance's floored values and stores them in result
     * @param result the instance to store the result in
     * @returns the result instance
     */
    floorToRef<R extends I>(result: R): R;

    /**
     * Gets a new instance from current instance fractional values
     * eg (1.2, 2.31) returns (0.2, 0.31)
     * @returns a new instance
     */
    fract(): Tensor<V, I>;

    /**
     * Gets the current instance's fractional values and stores them in result
     * @param result the instance to store the result in
     * @returns the result instance
     */
    fractToRef<R extends I>(result: R): R;

    /**
     * Gets a new instance copied from the instance
     * @returns a new instance
     */
    clone(): Tensor<V, I>;
}

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Static side of Tensor
 * @see Tensor
 */
export interface TensorStatic<T extends Tensor<any[], _I>, _I = TensorLike<T>> {
    /**
     * Creates a new instance from the given coordinates
     */
    new (...coords: Flatten<ValueOfTensor<T>>): T;

    /**
     * So [[static]].prototype has typings, instead of just any
     */
    prototype: T;

    /**
     * Returns a new instance with random values between min and max
     * @param min the minimum random value
     * @param max the maximum random value
     * @returns a instance with random values between min and max
     */
    Random(min?: number, max?: number): T;

    /**
     * Returns a new instance with random values between min and max
     * @param min the minimum random value
     * @param max the maximum random value
     * @param result the result to store the random values in
     * @returns the updated result instance
     */
    RandomToRef(min: number | undefined, max: number | undefined, result: T): T;

    /**
     * Gets a new instance from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @returns a new instance
     */
    FromArray(array: DeepImmutable<FloatArray>, offset?: number): T;

    /**
     * Sets "result" from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @param result defines the target instance
     * @returns result input
     */
    FromArrayToRef(array: DeepImmutable<FloatArray>, offset: number, result: T): T;

    /**
     * Sets the given instance "result" with the given floats.
     * @param args defines the coordinates of the source with the last paramater being the result
     */
    FromFloatsToRef(...args: [...Flatten<ValueOfTensor<T>>, T]): T;

    /**
     * Gets the dot product of the instance "left" and the instance "right"
     * @param left defines first instance
     * @param right defines second instance
     * @returns the dot product (float)
     */
    Dot(left: DeepImmutable<_I>, right: DeepImmutable<_I>): number;

    /**
     * Gets a new instance set with the minimal coordinate values from the "left" and "right" instances
     * @param left defines 1st instance
     * @param right defines 2nd instance
     * @returns a new instance
     */
    Minimize(left: DeepImmutable<_I>, right: DeepImmutable<_I>): T;

    /**
     * Gets a new instance set with the maximal coordinate values from the "left" and "right" instances
     * @param left defines 1st instance
     * @param right defines 2nd instance
     * @returns a new instance
     */
    Maximize(left: DeepImmutable<_I>, right: DeepImmutable<_I>): T;

    /**
     * Gets the distance between the instances "value1" and "value2"
     * @param value1 defines first instance
     * @param value2 defines second instance
     * @returns the distance between instances
     */
    Distance(value1: DeepImmutable<_I>, value2: DeepImmutable<_I>): number;

    /**
     * Returns the squared distance between the instances "value1" and "value2"
     * @param value1 defines first instance
     * @param value2 defines second instance
     * @returns the squared distance between instances
     */
    DistanceSquared(value1: DeepImmutable<_I>, value2: DeepImmutable<_I>): number;

    /**
     * Gets a new instance located at the center of the instances "value1" and "value2"
     * @param value1 defines first instance
     * @param value2 defines second instance
     * @returns a new instance
     */
    Center(value1: DeepImmutable<_I>, value2: DeepImmutable<_I>): T;

    /**
     * Gets the center of the instances "value1" and "value2" and stores the result in the instance "ref"
     * @param value1 defines first instance
     * @param value2 defines second instance
     * @param ref defines third instance
     * @returns ref
     */
    CenterToRef(value1: DeepImmutable<_I>, value2: DeepImmutable<_I>, ref: T): T;

    /**
     * Returns a new instance set with same the coordinates than "value" ones if the instance "value" is in the square defined by "min" and "max".
     * If a coordinate of "value" is lower than "min" coordinates, the returned instance is given this "min" coordinate.
     * If a coordinate of "value" is greater than "max" coordinates, the returned instance is given this "max" coordinate
     * @param value defines the value to clamp
     * @param min defines the lower limit
     * @param max defines the upper limit
     * @returns a new instance
     */
    Clamp(value: DeepImmutable<_I>, min: DeepImmutable<_I>, max: DeepImmutable<_I>): T;

    /**
     * Returns a new instance set with same the coordinates than "value" ones if the instance "value" is in the square defined by "min" and "max".
     * If a coordinate of "value" is lower than "min" coordinates, the returned instance is given this "min" coordinate.
     * If a coordinate of "value" is greater than "max" coordinates, the returned instance is given this "max" coordinate
     * @param value defines the value to clamp
     * @param min defines the lower limit
     * @param max defines the upper limit
     * @param result defines the instance where to store the result
     * @returns the updated result instance
     */
    ClampToRef(value: DeepImmutable<_I>, min: DeepImmutable<_I>, max: DeepImmutable<_I>, result: T): T;
}
/* eslint-enable @typescript-eslint/naming-convention */
