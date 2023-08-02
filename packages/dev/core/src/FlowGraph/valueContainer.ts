/** @experimental */
export type ValueSetter<T> = (value: T) => void;

/**
 * @experimental
 */
export interface ValueContainer<T> {
    value: T;
    setValue: ValueSetter<T>;
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
