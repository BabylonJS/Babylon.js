import { Observable, Nullable, Observer } from "babylonjs";

export class PromiseObservable<T> extends Observable<T> {

    public notifyWithPromise(eventData: T, mask: number = -1, target?: any, currentTarget?: any): Promise<any> {

        let p = Promise.resolve();

        if (!this._observers.length) {
            return p;
        }

        let state = this['_eventState'];
        state.mask = mask;
        state.target = target;
        state.currentTarget = currentTarget;
        state.skipNextObservers = false;

        this._observers.forEach(obs => {
            if (state.skipNextObservers) {
                return;
            }
            if (obs.mask & mask) {
                if (obs.scope) {
                    // TODO - I can add the variable from the last function here. Requires changing callback sig
                    p = p.then(() => {
                        return obs.callback.apply(obs.scope, [eventData, state]);
                    });
                } else {
                    p = p.then(() => {
                        return obs.callback(eventData, state);
                    });
                }
            }
        });

        return p;
    }
}