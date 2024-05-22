import { Constants } from "../Engines/constants";

/**
 * Function indicating if a number is an exponent of 2
 * @param value defines the value to test
 * @returns true if the value is an exponent of 2
 */
export function IsExponentOfTwo(value: number): boolean {
    let count = 1;

    do {
        count *= 2;
    } while (count < value);

    return count === value;
}

/**
 * Interpolates between a and b via alpha
 * @param a The lower value (returned when alpha = 0)
 * @param b The upper value (returned when alpha = 1)
 * @param alpha The interpolation-factor
 * @returns The mixed value
 */
export function Mix(a: number, b: number, alpha: number): number {
    return a * (1 - alpha) + b * alpha;
}

/**
 * Find the nearest power of two.
 * @param x Number to start search from.
 * @returns Next nearest power of two.
 */
export function NearestPOT(x: number): number {
    const c = CeilingPOT(x);
    const f = FloorPOT(x);
    return c - x > x - f ? f : c;
}

/**
 * Find the next highest power of two.
 * @param x Number to start search from.
 * @returns Next highest power of two.
 */
export function CeilingPOT(x: number): number {
    x--;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    x++;
    return x;
}

/**
 * Find the next lowest power of two.
 * @param x Number to start search from.
 * @returns Next lowest power of two.
 */
export function FloorPOT(x: number): number {
    x = x | (x >> 1);
    x = x | (x >> 2);
    x = x | (x >> 4);
    x = x | (x >> 8);
    x = x | (x >> 16);
    return x - (x >> 1);
}

/**
 * Get the closest exponent of two
 * @param value defines the value to approximate
 * @param max defines the maximum value to return
 * @param mode defines how to define the closest value
 * @returns closest exponent of two of the given value
 */
export function GetExponentOfTwo(value: number, max: number, mode = Constants.SCALEMODE_NEAREST): number {
    let pot;

    switch (mode) {
        case Constants.SCALEMODE_FLOOR:
            pot = FloorPOT(value);
            break;
        case Constants.SCALEMODE_NEAREST:
            pot = NearestPOT(value);
            break;
        case Constants.SCALEMODE_CEILING:
        default:
            pot = CeilingPOT(value);
            break;
    }

    return Math.min(pot, max);
}
