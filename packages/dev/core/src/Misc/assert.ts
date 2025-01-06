/**
 * Asserts that the given value is truthy.
 * @param value The value to check.
 */
export function assert(value: unknown): asserts value {
    if (!value) {
        throw new Error("assertion failed");
    }
}
