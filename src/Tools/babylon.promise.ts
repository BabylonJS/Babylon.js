module BABYLON {

    enum PromiseStates {
        Pending,
        Fulfilled,
        Rejected
    }

    class InternalPromise<T> {
        private _state = PromiseStates.Pending;
        private _result?: Nullable<T>;
        private _reason: string;
        private _child: InternalPromise<T>;
        private _onFulfilled?: (fulfillment?: Nullable<T>) => Nullable<InternalPromise<T>>;
        private _onRejected?: (reason: string) => void;

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
        
        public reason(): string {
            if (!this.isRejected()) {
                throw new Error("Promise is not rejected");
            }
            return this._reason;
        }            

        public constructor(resolver?: (
            resolve:(value?: Nullable<T>) => void, 
            reject: (reason: string) => void
        ) => void) {

            if (!resolver) {
                return;
            }

            try {
                resolver((value?: Nullable<T>) => {
                    this._resolve(value);
                }, (reason: string) => {
                    this._reject(reason);
                });
            } catch(e) {
                this._reject((<Error>e).message);
            }
        }

        public catch(onRejected: (reason: string) => void): InternalPromise<T> {
            return this.then(undefined, onRejected);
        }

        public then(onFulfilled?: (fulfillment?: Nullable<T>) => Nullable<InternalPromise<T>>, onRejected?: (reason: string) => void): InternalPromise<T> {
            let newPromise = new InternalPromise<T>();
            newPromise._onFulfilled = onFulfilled;
            newPromise._onRejected = onRejected;

            // Composition
            this._child = newPromise;

            switch (this._state) {
                case PromiseStates.Fulfilled:
                    let returnedPromise = newPromise._resolve(this._result);

                    if (returnedPromise) {
                        newPromise._child = returnedPromise;
                        newPromise = returnedPromise;
                    }
                    break;
                case PromiseStates.Rejected:
                    newPromise._reject(this._reason);
                    newPromise._state = PromiseStates.Fulfilled;
                    break;
            }

            return newPromise;
        }       
        
        private _resolve(value?: Nullable<T>): Nullable<InternalPromise<T>> {
            try {
                this._state = PromiseStates.Fulfilled;
                this._result = value;
                let returnedPromise: Nullable<InternalPromise<T>> = null;

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

        private _reject(reason: string): void {
            this._state = PromiseStates.Rejected;
            this._reason = reason;

            if (this._onRejected) {
                this._onRejected(reason);
            }

            if (this._child) {
                this._child._resolve(null);
            }                
        }

        public static resolve<T>(value: T): InternalPromise<T> {
            let newPromise = new InternalPromise<T>();

            newPromise._resolve(value);

            return newPromise;
        }
    }

    export class PromisePolyfill {
        public static Apply(force = false) {
            if (force || typeof Promise === 'undefined') {
                let root:any = window;
                root.Promise = InternalPromise;
            }
        }
    }
}