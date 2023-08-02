export type ValueSetter<T> = (value: T) => void;

export interface ValueContainer<T> {
    value: T;
    setValue: ValueSetter<T>;
}

export function makeValueContainer<T>(value: T): ValueContainer<T> {
    const container = {
        value,
        setValue: (newValue: T) => (container.value = newValue),
    };
    return container;
}
