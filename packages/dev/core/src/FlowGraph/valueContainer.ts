/**
 * This interface represents a container for a value.
 * the intention is that only the setValue function should
 * be used to change the value.
 * @experimental
 */
export interface ValueContainer<T> {
    readonly value: T;
    readonly setValue: (value: T) => void;
}

/**
 * @experimental
 * @param value
 * @returns
 */
export function makeValueContainer<T>(value: T): ValueContainer<T> {
    const container = {
        value,
        setValue: (newValue: T) => (container.value = newValue),
    };
    return container;
}
