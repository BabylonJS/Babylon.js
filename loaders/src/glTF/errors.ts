import { BaseError } from "babylonjs/Misc/baseError";

/**
 * Application error when unexpected magic number is found.
 */
export class GlTFLoaderUnexpectedMagicError extends BaseError {

    /**
     * Creates a new GlTFLoaderUnexpectedMagicError
     * @param message defines the message of the error
     */
    constructor(message: string) {
        super(message);

        this.name = "GlTFLoaderUnexpectedMagicError";
        BaseError._setPrototypeOf(this, GlTFLoaderUnexpectedMagicError.prototype);
    }
}