import { BaseError } from "../Misc/baseError";
import { ErrorCodesType } from "../Misc/errorCodes";

/**
 * Application error to indicate texture validation errors.
 */
export class TextureValidationError extends BaseError {
    /**
     * Creates a new TextureValidationError
     * @param message defines the message of the error
     * @param errorCode the error code
     */
    constructor(message: string, errorCode: ErrorCodesType) {
        super(message, errorCode);

        this.name = "TextureValidationError";
        BaseError._setPrototypeOf(this, TextureValidationError.prototype);
    }
}
