import { BaseError } from "babylonjs/Misc/baseError";

/**
 * @ignore
 * Application error to support additional information when loading a file
 */
export class GlTFLoaderUnexpectedMagicError extends BaseError {

    /**
     * Creates a new GlTFLoaderUnexpectedMagicError
     * @param message defines the message of the error
     */
    constructor(message: string) {
        super(message);
    }
}