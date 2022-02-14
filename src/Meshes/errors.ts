import { BaseError } from "../Misc/baseError";
import { ErrorCodesType } from "../Misc/errorCodes";

/**
 * Application error to indicate mesh validation errors.
 */
export class MeshValidationError extends BaseError {
    /**
     * Creates a new MeshValidationError
     * @param message defines the message of the error
     * @param errorCode the error code
     */
    constructor(message: string, errorCode: ErrorCodesType) {
        super(message, errorCode);

        this.name = "MeshValidationError";
        BaseError._setPrototypeOf(this, MeshValidationError.prototype);
    }
}
