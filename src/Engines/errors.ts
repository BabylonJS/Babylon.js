import { BaseError } from "../Misc/baseError";

/**
 * Application error to indicate unsupported texture.
 */
export class UnsupportedTextureError extends BaseError {

    /**
     * Creates a new UnsupportedTextureError
     * @param message defines the message of the error
     */
    constructor(message: string) {
        super(message);

        this.name = "UnsupportedTextureError";
        BaseError._setPrototypeOf(this, UnsupportedTextureError.prototype);
    }
}