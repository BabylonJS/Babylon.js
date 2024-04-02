import { RegisterClass } from "../Misc/typeStore";

/**
 * @experimental
 * Class that represents an integer value.
 */
export class FlowGraphInteger {
    /**
     * The value of the integer. Its type
     * is a javascript number. Shouldn't be
     * directly modified - it is populated by
     * the constructor.
     */
    readonly value: number;

    constructor(value: number) {
        this.value = this._toInt(value);
    }

    /**
     * Converts a float to an integer.
     * @param n the float to convert
     * @returns the result of n | 0 - converting it to a int
     */
    private _toInt(n: number): number {
        return n | 0;
    }

    /**
     * Adds two integers together.
     * @param other the other integer to add
     * @returns a FlowGraphInteger with the result of the addition
     */
    public add(other: FlowGraphInteger): FlowGraphInteger {
        return new FlowGraphInteger(this.value + other.value);
    }

    /**
     * Subtracts two integers.
     * @param other the other integer to subtract
     * @returns a FlowGraphInteger with the result of the subtraction
     */
    public subtract(other: FlowGraphInteger): FlowGraphInteger {
        return new FlowGraphInteger(this.value - other.value);
    }

    /**
     * Multiplies two integers.
     * @param other the other integer to multiply
     * @returns a FlowGraphInteger with the result of the multiplication
     */
    public multiply(other: FlowGraphInteger): FlowGraphInteger {
        return new FlowGraphInteger(Math.imul(this.value, other.value));
    }

    /**
     * Divides two integers.
     * @param other the other integer to divide
     * @returns a FlowGraphInteger with the result of the division
     */
    public divide(other: FlowGraphInteger): FlowGraphInteger {
        return new FlowGraphInteger(this.value / other.value);
    }

    /**
     * The class name of this type.
     * @returns
     */
    public getClassName() {
        return FlowGraphInteger.ClassName;
    }

    /**
     * Compares two integers for equality.
     * @param other the other integer to compare
     * @returns
     */
    public equals(other: FlowGraphInteger): boolean {
        return this.value === other.value;
    }

    public static ClassName = "FlowGraphInteger";

    /**
     * Parses a FlowGraphInteger from a serialization object.
     * @param serializationObject
     * @returns
     */
    public static Parse(serializationObject: any): FlowGraphInteger {
        return new FlowGraphInteger(serializationObject.value);
    }
}
RegisterClass("FlowGraphInteger", FlowGraphInteger);
