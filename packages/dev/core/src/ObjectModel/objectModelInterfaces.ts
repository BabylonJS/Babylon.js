/**
 * A container with an original object and information about that object.
 * on some other object.
 */
export interface IObjectInfo<T> {
    /**
     * The original object.
     */
    object: any;
    /**
     * Information about the object.
     */
    info: T;
}

/**
 * Interface for a converter that takes a string path and transforms
 * it into an ObjectAccessorContainer.
 */
export interface IPathToObjectConverter<T> {
    convert(path: string): IObjectInfo<T>;
}
