import { BaseError } from "../Misc/baseError";

/**
 * Application error to indicate load scene failures.
 */
export class SceneLoaderError extends BaseError {
    /**
     * Creates a new SceneLoaderError
     * @param message defines the message of the error
     * @param innerException the exception that caused the outer exception
     */
    constructor(message: string, innerException?: Error) {
        super(message, "SceneLoaderError", innerException);

        this.name = "SceneLoaderError";
        BaseError._setPrototypeOf(this, SceneLoaderError.prototype);
    }
}
