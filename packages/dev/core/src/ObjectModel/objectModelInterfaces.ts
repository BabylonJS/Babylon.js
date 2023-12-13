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
    get(...args: any[]): any;
    set(value: any, ...args: any[]): void;
    getObject(obj: any): any;
}

/**
 * Interface for a converter that takes a string path and transforms
 * it into an ObjectAccessorContainer.
 */
export interface IPathToObjectConverter<T> {
    convert(path: string): IObjectAccessorContainer<T>;
}
