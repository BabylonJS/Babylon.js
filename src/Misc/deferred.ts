/**
 * Wrapper class for promise with external resolve and reject.
 */
export class Deferred<T> {
    /**
     * The promise associated with this deferred object.
     */
    public readonly promise: Promise<T>;

    private _resolve: (value: T | PromiseLike<T>) => void;
    private _reject: (reason?: any) => void;

    /**
     * The resolve method of the promise associated with this deferred object.
     */
    public get resolve() {
        return this._resolve;
    }

    /**
     * The reject method of the promise associated with this deferred object.
     */
    public get reject() {
        return this._reject;
    }

    /**
     * Constructor for this deferred object.
     */
    constructor() {
        this.promise = new Promise((resolve: (value: T | PromiseLike<T>) => void, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
}
