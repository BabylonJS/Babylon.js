import { BaseError } from "../Misc/baseError";

/**
 * @ignore
 * Application error to support additional information when loading a file
 */
export class UnsupportedTextureError extends BaseError {

    /**
     * Creates a new UnsupportedTextureError
     * @param message defines the message of the error
     */
    constructor(message: string) {
        super(message);
    }
}