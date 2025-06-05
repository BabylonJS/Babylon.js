/**
 * This describes a strong reference to any data type.
 */
export type StrongRef<T> = {
    /**
     * The value of the strong reference.
     */
    value: T;
};

/**
 * Create a strong reference to the given value.
 * @param value - the value to wrap in a strong reference
 * @returns the strong reference containing the value
 */
export function createStrongRef<T>(value: T): StrongRef<T> {
    return { value };
}
