import { Nullable } from "../types";

enum PromiseStates {
    Pending,
    Fulfilled,
    Rejected
}

class FulFillmentAgregator<T> {
    public count = 0;
    public target = 0;
    public rootPromise: InternalPromise<T>;
    public results: any[] = [];
}

class InternalPromise<T> {
    private _state = PromiseStates.Pending;
    private _resultValue?: Nullable<T>;
    private _reason: any;
    private _children = new Array<InternalPromise<T>>();
    private _parent: Nullable<InternalPromise<T>>;
    private _onFulfilled?: (fulfillment?: Nullable<T>) => Nullable<InternalPromise<T>> | T;
    private _onRejected?: (reason: any) => void;
    private _rejectWasConsumed = false;

    private get _result(): Nullable<T> | undefined {
        return this._resultValue;
    }

    private set _result(value: Nullable<T> | undefined) {
        this._resultValue = value;

        if (this._parent && this._parent._result === undefined) {
            this._parent._result = value;
        }
    }

    public constructor(resolver?: (
        resolve: (value?: Nullable<T>) => void,
        reject: (reason: any) => void
    ) => void) {

        if (!resolver) {
            return;
        }

        try {
            resolver((value?: Nullable<T>) => {
                this._resolve(value);
            }, (reason: any) => {
                this._reject(reason);
            });
        } catch (e) {
            this._reject(e);
        }
    }

    public catch(onRejected: (reason: any) => void): InternalPromise<T> {
        return this.then(undefined, onRejected);
    }

    public then(onFulfilled?: (fulfillment?: Nullable<T>) => Nullable<InternalPromise<T>> | T, onRejected?: (reason: any) => void): InternalPromise<T> {
        let newPromise = new InternalPromise<T>();
        newPromise._onFulfilled = onFulfilled;
        newPromise._onRejected = onRejected;

        // Composition
        this._children.push(newPromise);
        newPromise._parent = this;

        if (this._state !== PromiseStates.Pending) {
            setTimeout(() => {
                if (this._state === PromiseStates.Fulfilled || this._rejectWasConsumed) {
                    let returnedValue: any = newPromise._resolve(this._result);

                    if (returnedValue !== undefined && returnedValue !== null) {
                        if ((<any>returnedValue)._state !== undefined) {
                            let returnedPromise = returnedValue as InternalPromise<T>;
                            newPromise._children.push(returnedPromise);
                            returnedPromise._parent = newPromise;
                            newPromise = returnedPromise;
                        } else {
                            newPromise._result = (<T>returnedValue);
                        }
                    }
                } else {
                    newPromise._reject(this._reason);
                }
            });
        }

        return newPromise;
    }

    private _moveChildren(children: InternalPromise<T>[]): void {
        this._children.push(...children.splice(0, children.length));

        this._children.forEach((child) => {
            child._parent = this;
        });

        if (this._state === PromiseStates.Fulfilled) {
            for (var child of this._children) {
                child._resolve(this._result);
            }
        } else if (this._state === PromiseStates.Rejected) {
            for (var child of this._children) {
                child._reject(this._reason);
            }
        }
    }

    private _resolve(value?: Nullable<T>): void {
        try {
            this._state = PromiseStates.Fulfilled;
            let returnedValue: Nullable<InternalPromise<T>> | T = null;

            if (this._onFulfilled) {
                returnedValue = this._onFulfilled(value);
            }

            if (returnedValue !== undefined && returnedValue !== null) {
                if ((<InternalPromise<T>>returnedValue)._state !== undefined) {
                    // Transmit children
                    let returnedPromise = returnedValue as InternalPromise<T>;
                    returnedPromise._parent = this;
                    returnedPromise._moveChildren(this._children);

                    value = returnedPromise._result;
                } else {
                    value = <T>returnedValue;
                }
            }

            this._result = value;

            for (var child of this._children) {
                child._resolve(value);
            }

            this._children.length = 0;
            delete this._onFulfilled;
            delete this._onRejected;
        } catch (e) {
            this._reject(e, true);
        }
    }

    private _reject(reason: any, onLocalThrow = false): void {
        this._state = PromiseStates.Rejected;
        this._reason = reason;

        if (this._onRejected && !onLocalThrow) {
            try {
                this._onRejected(reason);
                this._rejectWasConsumed = true;
            }
            catch (e) {
                reason = e;
            }
        }

        for (var child of this._children) {
            if (this._rejectWasConsumed) {
                child._resolve(null);
            } else {
                child._reject(reason);
            }
        }

        this._children.length = 0;
        delete this._onFulfilled;
        delete this._onRejected;
    }

    public static resolve<T>(value: T): InternalPromise<T> {
        let newPromise = new InternalPromise<T>();

        newPromise._resolve(value);

        return newPromise;
    }

    private static _RegisterForFulfillment<T>(promise: InternalPromise<T>, agregator: FulFillmentAgregator<T[]>, index: number) {
        promise.then((value?: Nullable<T>) => {
            agregator.results[index] = value;
            agregator.count++;

            if (agregator.count === agregator.target) {
                agregator.rootPromise._resolve(agregator.results);
            }
            return null;
        }, (reason: any) => {
            if (agregator.rootPromise._state !== PromiseStates.Rejected) {
                agregator.rootPromise._reject(reason);
            }
        });
    }

    public static all<T>(promises: InternalPromise<T>[]): InternalPromise<T[]> {
        let newPromise = new InternalPromise<T[]>();
        let agregator = new FulFillmentAgregator<T[]>();
        agregator.target = promises.length;
        agregator.rootPromise = newPromise;

        if (promises.length) {
            for (var index = 0; index < promises.length; index++) {
                InternalPromise._RegisterForFulfillment(promises[index], agregator, index);
            }
        } else {
            newPromise._resolve([]);
        }

        return newPromise;
    }

    public static race<T>(promises: InternalPromise<T>[]): InternalPromise<T> {
        let newPromise: Nullable<InternalPromise<T>> = new InternalPromise();

        if (promises.length) {
            for (const promise of promises) {
                promise.then((value?: Nullable<T>) => {
                    if (newPromise) {
                        newPromise._resolve(value);
                        newPromise = null;
                    }
                    return null;
                }, (reason: any) => {
                    if (newPromise) {
                        newPromise._reject(reason);
                        newPromise = null;
                    }
                });
            }
        }

        return newPromise;
    }
}

/**
 * Helper class that provides a small promise polyfill
 */
export class PromisePolyfill {
    /**
     * Static function used to check if the polyfill is required
     * If this is the case then the function will inject the polyfill to window.Promise
     * @param force defines a boolean used to force the injection (mostly for testing purposes)
     */
    public static Apply(force = false): void {
        if (force || typeof Promise === 'undefined') {
            let root: any = window;
            root.Promise = InternalPromise;
        }
    }
}
