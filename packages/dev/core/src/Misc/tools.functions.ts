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
