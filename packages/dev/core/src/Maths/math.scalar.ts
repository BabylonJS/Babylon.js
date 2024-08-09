import * as functions from "./math.scalar.functions";

const HCF: (a: number, b: number) => number = functions.HighestCommonFactor;

/**
 * Scalar computation library
 * @deprecated Please use the scalar functions
 */
/* eslint-disable @typescript-eslint/naming-convention */
export const Scalar = {
    ...functions,

    /**
     * Two pi constants convenient for computation.
     */
    TwoPi: Math.PI * 2,

    /**
     * Returns -1 if value is negative and +1 is value is positive.
     * @param value the value
     * @returns the value itself if it's equal to zero.
     */
    Sign: Math.sign,

    /**
     * the log2 of value.
     * @param value the value to compute log2 of
     * @returns the log2 of value.
     */
    Log2: Math.log2,

    /**
     * Returns the highest common factor of two integers.
     * @param a first parameter
     * @param b second parameter
     * @returns HCF of a and b
     */
    HCF,
};
/* eslint-enable @typescript-eslint/naming-convention */
