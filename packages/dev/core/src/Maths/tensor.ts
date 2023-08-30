import type { DeepImmutable, Flatten, FloatArray, MultidimensionalArray } from "../types";

/**
 * Describes a mathimatical tensor.
 * @see https://en.wikipedia.org/wiki/Tensor
 */
export declare abstract class Tensor<V extends MultidimensionalArray<number, number> = number[]> {
    /**
     * The number of dimensions the tensor has (i.e. the length of the coordinate array)
     * 
     * @remarks
     * This is abstract to allow implementations with getter
     */
    abstract readonly dimension: number[];

    /**
     * Creates a new Tensor from the given coordinates
     */
    constructor(...coords: Flatten<V>);

    /**
     * Gets a string with the Tensor coordinates
     * @returns a string with the Tensor coordinates
     */

    toString(): string;

    /**
     * Gets class name
     * @returns the class name
     */

    getClassName(): string;

    /**
     * Gets current tensor hash code
     * @returns the Tensor hash code as a number
     */
    getHashCode(): number;

    /**
     * Sets the Tensor coordinates in the given array from the given index.
     * @param array defines the source array
     * @param index defines the offset in source array
     * @returns the current Tensor
     */
    toArray(array: FloatArray, index?: number): this;

    /**
     * Update the current tensor from an array
     * @param array defines the destination array
     * @param index defines the offset in the destination array
     * @returns the current Tensor
     */
    fromArray(array: FloatArray, index?: number): this;

    /**
     * Copy the current tensor to an array
     * @returns a new array with the Tensor coordinates.
     */
    asArray(): Flatten<V>;

    /**
     * Sets the current Tensor coordinates with the given source coordinates
     * @param source defines the source Tensor
     * @returns the current updated Tensor
     */
    copyFrom(source: DeepImmutable<this>): this;

    /**
     * Sets the Tensor coordinates with the given floats
     * @returns the current updated Tensor
     */

    copyFromFloats(...floats: Flatten<V>): this;

    /**
     * Sets the Tensor coordinates with the given floats
     * @returns the current updated Tensor
     */
    set(...values: Flatten<V>): this;

    /**
     * Sets the Tensor coordinates to the given value
     * @returns the current updated Tensor
     */
    setAll(value: number): this;

    /**
     * Add another tensor with the current one
     * @param otherTensor defines the other tensor
     * @returns a new Tensor set with the addition of the current Tensor and the given one coordinates
     */
    add(otherTensor: DeepImmutable<this>): this;

    /**
     * Sets the "result" coordinates with the addition of the current Tensor and the given one coordinates
     * @param otherTensor defines the other tensor
     * @param result defines the target tensor
     * @returns result input
     */
    addToRef<T extends this>(otherTensor: DeepImmutable<T>, result: T): T;

    /**
     * Set the Tensor coordinates by adding the given Tensor coordinates
     * @param otherTensor defines the other tensor
     * @returns the current updated Tensor
     */
    addInPlace(otherTensor: DeepImmutable<this>): this;

    /**
     * Adds the given coordinates to the current Tensor
     * @param floats the floats to add
     * @returns the current updated Tensor
     */
    addInPlaceFromFloats(...floats: Flatten<V>): this;

    /**
     * Gets a new Tensor2 set with the subtracted coordinates of the given one from the current Tensor2
     * @param otherTensor defines the other tensor
     * @returns a new Tensor
     */
    subtract(otherTensor: DeepImmutable<this>): this;

    /**
     * Sets the "result" coordinates with the subtraction of the given one from the current Tensor coordinates.
     * @param otherTensor defines the other tensor
     * @param result defines the target tensor
     * @returns result input
     */
    subtractToRef<T extends this>(otherTensor: DeepImmutable<this>, result: T): T;

    /**
     * Sets the current Tensor coordinates by subtracting from it the given one coordinates
     * @param otherTensor defines the other tensor
     * @returns the current updated Tensor
     */
    subtractInPlace(otherTensor: DeepImmutable<this>): this;

    /**
     * Returns a new Tensor set with the subtraction of the given floats from the current Tensor coordinates
     * @param floats the coordinates to subtract
     * @returns the resulting Tensor
     */
    subtractFromFloats(...floats: Flatten<V>): this;

    /**
     * Subtracts the given floats from the current Tensor coordinates and set the given tensor "result" with this result
     * Note: Implementation uses array magic so types may be confusing.
     * @param args the coordinates to subtract with the last element as the result
     * @returns the result
     */
    subtractFromFloatsToRef<T extends this>(...args: [...Flatten<V>, T]): T;

    /**
     * Returns a new Tensor set with the multiplication of the current Tensor and the given one coordinates
     * @param otherTensor defines the other tensor
     * @returns a new Tensor
     */
    multiply(otherTensor: DeepImmutable<this>): this;

    /**
     * Sets "result" coordinates with the multiplication of the current Tensor and the given one coordinates
     * @param otherTensor defines the other tensor
     * @param result defines the target tensor
     * @returns result input
     */
    multiplyToRef<T extends this>(otherTensor: DeepImmutable<this>, result: T): T;

    /**
     * Multiplies in place the current Tensor coordinates by the given ones
     * @param otherTensor defines the other tensor
     * @returns the current updated Tensor
     */
    multiplyInPlace(otherTensor: DeepImmutable<this>): this;

    /**
     * Gets a new Tensor set with the Tensor coordinates multiplied by the given floats
     * @returns a new Tensor
     */
    multiplyByFloats(...floats: Flatten<V>): this;

    /**
     * Returns a new Tensor set with the Tensor coordinates divided by the given one coordinates
     * @param otherTensor defines the other tensor
     * @returns a new Tensor
     */
    divide(otherTensor: DeepImmutable<this>): this;

    /**
     * Sets the "result" coordinates with the Tensor divided by the given one coordinates
     * @param otherTensor defines the other tensor
     * @param result defines the target tensor
     * @returns result input
     */
    divideToRef<T extends this>(otherTensor: DeepImmutable<this>, result: T): T;

    /**
     * Divides the current Tensor coordinates by the given ones
     * @param otherTensor defines the other tensor
     * @returns the current updated Tensor
     */
    divideInPlace(otherTensor: DeepImmutable<this>): this;

    /**
     * Updates the current Tensor with the minmal coordinate values between its and the given tensor ones.
     * @param otherTensor defines the other tensor
     * @returns this current updated Tensor
     */
    minimizeInPlace(otherTensor: DeepImmutable<this>): this;

    /**
     * Updates the current Tensor with the minmal coordinate values between its and the given floats.
     * @param floats defines the floats to compare against
     * @returns this current updated Tensor
     */
    minimizeInPlaceFromFloats(...floats: Flatten<V>): this;

    /**
     * Updates the current Tensor with the maximal coordinate values between its and the given tensor ones.
     * @param otherTensor defines the other tensor
     * @returns this current updated Tensor
     */
    maximizeInPlace(otherTensor: DeepImmutable<this>): this;

    /**
     * Updates the current Tensor with the maximal coordinate values between its and the given floats.
     * @param floats defines the floats to compare against
     * @returns this current updated Tensor
     */
    maximizeInPlaceFromFloats(...floats: Flatten<V>): this;

    /**
     * Gets a new Tensor with current Tensor negated coordinates
     * @returns a new Tensor
     */
    negate(): this;

    /**
     * Negate this tensor in place
     * @returns this
     */
    negateInPlace(): this;

    /**
     * Negate the current Tensor and stores the result in the given tensor "result" coordinates
     * @param result defines the Tensor object where to store the result
     * @returns the result
     */
    negateToRef<T extends this>(result: T): T;

    /**
     * Multiply the Tensor coordinates by
     * @param scale defines the scaling factor
     * @returns the current updated Tensor
     */
    scaleInPlace(scale: number): this;

    /**
     * Returns a new Tensor scaled by "scale" from the current Tensor
     * @param scale defines the scaling factor
     * @returns a new Tensor
     */
    scale(scale: number): this;

    /**
     * Scale the current Tensor values by a factor to a given Tensor
     * @param scale defines the scale factor
     * @param result defines the Tensor object where to store the result
     * @returns result input
     */
    scaleToRef<T extends this>(scale: number, result: T): T;

    /**
     * Scale the current Tensor values by a factor and add the result to a given Tensor
     * @param scale defines the scale factor
     * @param result defines the Tensor object where to store the result
     * @returns result input
     */
    scaleAndAddToRef<T extends this>(scale: number, result: T): T;

    /**
     * Gets a boolean if two tensors are equals
     * @param otherTensor defines the other tensor
     * @returns true if the given tensor coordinates strictly equal the current Tensor ones
     */
    equals(otherTensor: DeepImmutable<this>): boolean;

    /**
     * Gets a boolean if two tensors are equals (using an epsilon value)
     * @param otherTensor defines the other tensor
     * @param epsilon defines the minimal distance to consider equality
     * @returns true if the given tensor coordinates are close to the current ones by a distance of epsilon.
     */
    equalsWithEpsilon(otherTensor: DeepImmutable<this>, epsilon?: number): boolean;

    /**
     * Returns true if the current Vectoe coordinates equals the given floats
     * @param floats defines the coordinates to compare against
     * @returns true if both tensors are equal
     */
    equalsToFloats(...floats: V): boolean;

    /**
     * Gets a new Tensor from current Tensor floored values
     * eg (1.2, 2.31) returns (1, 2)
     * @returns a new Tensor
     */
    floor(): this;

    /**
     * Gets the current Tensor's floored values and stores them in result
     * @param result the Tensor to store the result in
     * @returns the result Tensor
     */
    floorToRef<T extends this>(result: T): T;

    /**
     * Gets a new Tensor from current Tensor fractional values
     * eg (1.2, 2.31) returns (0.2, 0.31)
     * @returns a new Tensor
     */
    fract(): this;

    /**
     * Gets the current Tensor's fractional values and stores them in result
     * @param result the Tensor to store the result in
     * @returns the result Tensor
     */
    fractToRef<T extends this>(result: T): T;

    /**
     * Gets a new Tensor copied from the Tensor
     * @returns a new Tensor
     */
    clone(): this;

    /**
     * Returns a new Tensor with random values between min and max
     * @param min the minimum random value
     * @param max the maximum random value
     * @returns a Tensor with random values between min and max
     */
    static Random<T extends Tensor>(min?: number, max?: number): T;

    /**
     * Returns a new Tensor with random values between min and max
     * @param min the minimum random value
     * @param max the maximum random value
     * @param result the result to store the random values in
     * @returns the updated result Tensor
     */
    static RandomToRef<T extends Tensor>(min: number | undefined, max: number | undefined, result: T): T;

    /**
     * Gets a new tensor from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @returns a new tensor
     */
    static FromArray(array: ArrayLike<number>, offset?: number): Tensor;

    /**
     * Sets "result" from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @param result defines the target tensor
     * @returns result input
     */
    static FromArrayToRef<T extends Tensor>(array: ArrayLike<number>, offset: number, result: T): T;

    /**
     * Sets the given tensor "result" with the given floats.
     * @param args defines the coordinates of the source with the last paramater being the result
     */
    static FromFloatsToRef<T extends Tensor, N extends number[] = number[]>(...args: [...N, T]): T;

    /**
     * Gets the dot product of the tensor "left" and the tensor "right"
     * @param left defines first tensor
     * @param right defines second tensor
     * @returns the dot product (float)
     */
    static Dot<T extends Tensor>(left: DeepImmutable<T>, right: DeepImmutable<T>): number;

    /**
     * Gets a new Tensor set with the minimal coordinate values from the "left" and "right" tensors
     * @param left defines 1st tensor
     * @param right defines 2nd tensor
     * @returns a new Tensor
     */
    static Minimize<T extends Tensor>(left: DeepImmutable<T>, right: DeepImmutable<T>): T;

    /**
     * Gets a new Tensor set with the maximal coordinate values from the "left" and "right" tensors
     * @param left defines 1st tensor
     * @param right defines 2nd tensor
     * @returns a new Tensor
     */
    static Maximize<T extends Tensor>(left: DeepImmutable<T>, right: DeepImmutable<T>): T;

    /**
     * Gets the distance between the tensors "value1" and "value2"
     * @param value1 defines first tensor
     * @param value2 defines second tensor
     * @returns the distance between tensors
     */
    static Distance<T extends Tensor>(value1: DeepImmutable<T>, value2: DeepImmutable<T>): number;

    /**
     * Returns the squared distance between the tensors "value1" and "value2"
     * @param value1 defines first tensor
     * @param value2 defines second tensor
     * @returns the squared distance between tensors
     */
    static DistanceSquared<T extends Tensor>(value1: DeepImmutable<T>, value2: DeepImmutable<T>): number;

    /**
     * Gets a new Tensor located at the center of the tensors "value1" and "value2"
     * @param value1 defines first tensor
     * @param value2 defines second tensor
     * @returns a new Tensor
     */
    static Center<T extends Tensor>(value1: DeepImmutable<T>, value2: DeepImmutable<T>): T;

    /**
     * Gets the center of the tensors "value1" and "value2" and stores the result in the tensor "ref"
     * @param value1 defines first tensor
     * @param value2 defines second tensor
     * @param ref defines third tensor
     * @returns ref
     */
    static CenterToRef<T extends Tensor>(value1: DeepImmutable<T>, value2: DeepImmutable<T>, ref: T): T;
}
