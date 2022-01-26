import { BaseError } from "../Misc/baseError";

/**
 * Application error to indicate invalid mesh positions.
 */
export class MeshInvalidOrEmptyPositionsError extends BaseError {

    /**
     * Creates a new MeshInvalidOrEmptyPositionsError
     * @param message defines the message of the error
     */
    constructor(message: string) {
        super(message);

        this.name = "MeshInvalidOrEmptyPositionsError";
        BaseError._setPrototypeOf(this, MeshInvalidOrEmptyPositionsError.prototype);
    }
}