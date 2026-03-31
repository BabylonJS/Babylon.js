/**
 * A class that lazily initializes a value given a factory function.
 */
export class Lazy<T> {
    private _factory: (() => T) | undefined;
    private _value: T | undefined;

    /**
     * Creates a new instance of the Lazy class.
     * @param factory A function that creates the value.
     */
    constructor(factory: () => T) {
        this._factory = factory;
    }

    /**
     * Gets the lazily initialized value.
     */
    public get value(): T {
        // If the factory function is still defined, it means we haven't called it yet.
        if (this._factory) {
            this._value = this._factory();
            // Set the factory function to undefined to allow it to be garbage collected.
            this._factory = undefined;
        }
        return this._value as T;
    }
}
