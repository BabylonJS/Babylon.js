module BABYLON {

    enum PromiseStates {
        Pending,
        Fulfilled,
        Rejected
    }

    class FulFillmentAgregator<T> {
        public count = 0;
        public target = 0;
        public rootPromise: InternalPromise<T>;
        public results:any[] = [];
    }

    class InternalPromise<T> {
        private _state = PromiseStates.Pending;
        private _result?: Nullable<T>;
        private _reason: any;
        private _child: InternalPromise<T>;
        private _onFulfilled?: (fulfillment?: Nullable<T>) => Nullable<InternalPromise<T>> | T;
        private _onRejected?: (reason: any) => void;
        private _rejectWasConsumed = false;

        public get state(): PromiseStates {
            return this._state;
        }

        public isFulfilled(): boolean {
            return this._state === PromiseStates.Fulfilled;
        }            

        public isRejected(): boolean {
            return this._state === PromiseStates.Rejected;
        }
    
        public isPending(): boolean {
            return this._state === PromiseStates.Pending;
        }
    
        public value(): Nullable<T> | undefined {
            if (!this.isFulfilled()) {
                throw new Error("Promise is not fulfilled");
            }
            return this._result;
        }     
        
        public reason(): any {
            if (!this.isRejected()) {
                throw new Error("Promise is not rejected");
            }
            return this._reason;
        }            

        public constructor(resolver?: (
            resolve:(value?: Nullable<T>) => void, 
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
            } catch(e) {
                this._reject((<Error>e).message);
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
            this._child = newPromise;

            if (this._state !== PromiseStates.Pending) {
                if (this._state === PromiseStates.Fulfilled || this._rejectWasConsumed) {
                    let returnedValue = newPromise._resolve(this._result);

                    if (returnedValue !== undefined && returnedValue !== null) {
                        if ((<InternalPromise<T>>returnedValue)._state !== undefined) {
                            let returnedPromise = returnedValue as InternalPromise<T>;
                            newPromise._child = returnedPromise;
                            newPromise = returnedPromise;
                        } else {
                            newPromise._result = (<T>returnedValue);
                        }
                    }
                } else {
                    newPromise._reject(this._reason);
                }
            }

            return newPromise;
        }       
        
        private _resolve(value?: Nullable<T>): Nullable<InternalPromise<T>> | T {
            try {
                this._state = PromiseStates.Fulfilled;
                this._result = value;
                let returnedPromise: Nullable<InternalPromise<T>> | T = null;

                if (this._onFulfilled) {
                    returnedPromise = this._onFulfilled(value);
                }

                if (this._child) {
                    this._child._resolve(value);
                }                

                return returnedPromise;
            } catch(e) {
                this._reject((<Error>e).message);
            }

            return null;
        }

        private _reject(reason: any): void {
            this._state = PromiseStates.Rejected;
            this._reason = reason;

            if (this._onRejected) {
                this._onRejected(reason);
                this._rejectWasConsumed = true;
            }

            if (this._child) {
                if (this._rejectWasConsumed) {
                    this._child._resolve(null);
                } else {
                    this._child._reject(reason);
                }
            }                
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
                if (!agregator.rootPromise.isRejected) {
                    agregator.rootPromise._reject(reason);
                }
            })
        }

        public static all<T>(promises: InternalPromise<T>[]): InternalPromise<T[]> {
            let newPromise = new InternalPromise<T[]>();
            let agregator = new FulFillmentAgregator<T[]>();
            agregator.target = promises.length;
            agregator.rootPromise = newPromise;

            for(var index = 0; index < promises.length; index++) {
                InternalPromise._RegisterForFulfillment(promises[index], agregator, index);
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
                let root:any = window;
                root.Promise = InternalPromise;
            }
        }
    }
}