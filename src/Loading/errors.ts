import { BaseError } from "../Misc/baseError";

/**
 * Application error to indicate error when loading scene.
 */
export class SceneLoaderError extends BaseError {
    /**
     * The inner exception
     */
    private _innerException: any;

    /**
     * Creates a new SceneLoaderError
     * @param message defines the message of the error
     */
    constructor(message: string, innerException?: any) {
        super(message);

        this._innerException = innerException;

        this.name = "SceneLoaderError";
        BaseError._setPrototypeOf(this, SceneLoaderError.prototype);
    }

    public get innerException() {
        return this._innerException;
    }
}