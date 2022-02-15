import { ErrorCodesType } from "./errorCodes";

/**
 * See https://stackoverflow.com/questions/12915412/how-do-i-extend-a-host-object-e-g-error-in-typescript
 * and https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
 *
 * Polyfill for Object.setPrototypeOf if necessary.
 * @ignore
 */
export const setPrototypeOf: (o: any, proto: object | null) => any =
 (Object as any).setPrototypeOf || ((o, proto) => { o.__proto__ = proto; return o; });

/**
 * Base error. Due to limitations of typedoc-check and missing documentation
 * in lib.es5.d.ts, cannot extend Error directly for RuntimeError.
 * @ignore
 */
abstract class BaseError extends Error {}

/**
 * Application runtime error
 */
 export class RuntimeError extends BaseError {
    /**
     * The error code
     */
     public errorCode: ErrorCodesType;

    /**
     * Creates a new RuntimeError
     * @param message defines the message of the error
     * @param errorCode the error code
     */
    public constructor(message: string, errorCode: ErrorCodesType) {
        super(message);

        this.errorCode = errorCode;
        this.name = "RuntimeError";
        setPrototypeOf(this, RuntimeError.prototype);
    }
}

/**
 * Application runtime outer error that wraps the cause/innerError
 */
export class RuntimeWrapperError extends RuntimeError {
    /**
     * The error that caused this outer error
     */
    public innerError: Error;

    /**
     * Creates a new RuntimeWrapperError
     * @param message defines the message of the error
     * @param errorCode the error code
     * @param innerException the error that caused the outer error
     */
    public constructor(message: string, errorCode: ErrorCodesType, innerException: Error) {
        super(message, errorCode);

        this.innerError = innerException;

        this.name = "RuntimeWrapperError";
        setPrototypeOf(this, RuntimeWrapperError.prototype);
    }
}