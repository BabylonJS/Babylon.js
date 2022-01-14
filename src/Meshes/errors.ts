import { BaseError } from "../Misc/baseError";

/**
 * @ignore
 * Application error to support additional information when loading a file
 */
export class MeshInvalidOrEmptyPositionsError extends BaseError {

    /**
     * Creates a new MeshInvalidOrEmptyPositionsError
     * @param message defines the message of the error
     */
    constructor(message: string) {
        super(message);
    }
}