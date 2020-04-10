/**
 * @ignore
 * Application error to support additional information when loading a file
 */
export abstract class BaseError extends Error {
    // See https://stackoverflow.com/questions/12915412/how-do-i-extend-a-host-object-e-g-error-in-typescript
    // and https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

    // Polyfill for Object.setPrototypeOf if necessary.
    protected static _setPrototypeOf: (o: any, proto: object | null) => any =
        (Object as any).setPrototypeOf || ((o, proto) => { o.__proto__ = proto; return o; });
}