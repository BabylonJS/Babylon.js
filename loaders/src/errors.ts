import { BaseError } from "babylonjs/Misc/baseError";
import { ErrorCodesType } from "babylonjs/Misc/errorCodes";

/**
 * Application error to indicate GLTF loader errors.
 */
export class GLTFLoaderError extends BaseError {
    /**
     * Creates a new GLTFLoaderError
     * @param message defines the message of the error
     * @param errorCode the error code
     */
    constructor(message: string, errorCode: ErrorCodesType) {
        super(message, errorCode);

        this.name = "GLTFLoaderError";
        BaseError._setPrototypeOf(this, GLTFLoaderError.prototype);
    }
}
