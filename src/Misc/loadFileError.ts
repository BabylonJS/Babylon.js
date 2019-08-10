import { WebRequest } from './webRequest';

/**
 * @ignore
 * Application error to support additional information when loading a file
 */
export class LoadFileError extends Error {
    // See https://stackoverflow.com/questions/12915412/how-do-i-extend-a-host-object-e-g-error-in-typescript
    // and https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

    // Polyfill for Object.setPrototypeOf if necessary.
    private static _setPrototypeOf: (o: any, proto: object | null) => any =
        (Object as any).setPrototypeOf || ((o, proto) => { o.__proto__ = proto; return o; });

    /**
     * Creates a new LoadFileError
     * @param message defines the message of the error
     * @param request defines the optional web request
     */
    constructor(
        message: string,
        /** defines the optional web request */
        public request?: WebRequest
    ) {
        super(message);
        this.name = "LoadFileError";

        LoadFileError._setPrototypeOf(this, LoadFileError.prototype);
    }
}