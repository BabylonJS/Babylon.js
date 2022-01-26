import { BaseError } from "../Misc/baseError";

/**
 * Application error to indicate error when loading scene.
 */
export class SceneLoaderError extends BaseError {
    /**
     * Creates a new SceneLoaderError
     * @param message defines the message of the error
     * @param innerException the inner exception
     * @param errorCode the error code
     */
    constructor(message: string, innerException?: Error) {
        super(message, undefined, innerException);

        this.name = "SceneLoaderError";
        BaseError._setPrototypeOf(this, SceneLoaderError.prototype);
    }
}
