/**
 * This interface represents a container for a value.
 * the intention is that only the setValue function should
 * be used to change the value.
 * @experimental
 */
export interface ValueContainer<T> {
    value: T;
    setValue: (value: T) => void;
}

/**
 * @experimental
 * @param value
 * @returns
 */
export function makeValueContainer<T>(value: T): ValueContainer<T> {
    // question: Should we wrap this in a Proxy so it's not possible to change the value directly?
    const container = {
        value,
        setValue: (newValue: T) => (container.value = newValue),
    };
    return container;
}
