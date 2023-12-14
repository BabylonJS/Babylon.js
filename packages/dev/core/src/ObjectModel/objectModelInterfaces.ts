/**
 * A container with an original object and an accessor that allows modifying properties
 * on some other object.
 */
export interface IObjectAccessorContainer<T> {
    object: any;
    accessor: T;
}

/**
 * An accessor that allows modifying properties on some other object.
 */
export interface IObjectAccessor {
    /**
     * The type of the object that is converted
     */
    type: string;
    /**
     * Get a property value from the object.
     * @param args any necessary arguments to get the property value
     */
    get(...args: any[]): any;
    /**
     * Set a property value on the object.
     * @param value the value to set
     * @param args any necessary arguments to set the property value
     */
    set(value: any, ...args: any[]): void;
    /**
     * Get the original object
     * @param args any necessary arguments to get the original object
     */
    getObject(...args: any[]): any;
}

/**
 * Interface for a converter that takes a string path and transforms
 * it into an ObjectAccessorContainer.
 */
export interface IPathToObjectConverter<T> {
    convert(path: string): IObjectAccessorContainer<T>;
}
