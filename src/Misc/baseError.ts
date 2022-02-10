import { ErrorCodesType } from "./errorCodes";

/**
 * BabylonJS error internal class wrapper. Extending Error for a class with docs
 * fails typedoc validation, because lib.es5.d.ts does not have any docs for Error.
 * @ignore
 */
class BabylonJSErrorWrapper extends Error {}

/**
 * Base Error class for babylonjs errors
 */
export class BaseError extends BabylonJSErrorWrapper {
    // See https://stackoverflow.com/questions/12915412/how-do-i-extend-a-host-object-e-g-error-in-typescript
    // and https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

    // Polyfill for Object.setPrototypeOf if necessary.
    protected static _setPrototypeOf: (o: any, proto: object | null) => any =
        (Object as any).setPrototypeOf || ((o, proto) => { o.__proto__ = proto; return o; });

    /**
     * The error code
     */
    public errorCode?: ErrorCodesType;

    /**
     * The exception that caused the outer exception
     */
    public innerException?: Error;

    /**
     * Creates a new BaseError
     * @param message defines the message of the error
     * @param errorCode the error code
     * @param innerException the exception that caused the outer exception
     */
    public constructor(message: string, errorCode?: ErrorCodesType, innerException?: Error) {
        super(message);

        this.errorCode = errorCode;
        this.innerException = innerException;

        this.name = "BaseError";
        BaseError._setPrototypeOf(this, BaseError.prototype);
    }
}