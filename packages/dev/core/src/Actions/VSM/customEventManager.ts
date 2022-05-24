import { Observable } from "../../Misc/observable";

export interface ICustomEvent<T> {
    name: string;
    localize?: boolean; // should parent be notified of this event?
    payload?: T;
}

export class CustomEventManager {
    public onEventRaisedObservable: Observable<ICustomEvent<any>> = new Observable();
    public onDisposeObservable: Observable<void> = new Observable();
    public eventObservables: { [key: string]: Observable<ICustomEvent<any>> } = {};

    constructor(private _parent?: CustomEventManager) {}

    public addEventListener<T = undefined>(eventName: string, callback: (event: ICustomEvent<T>) => void): void {
        if (!this.eventObservables[eventName]) {
            this.eventObservables[eventName] = new Observable();
        }

        this.eventObservables[eventName].add(callback);
    }

    public removeEventListener<T = undefined>(eventName: string, callback: (event: ICustomEvent<T>) => void): void {
        if (!this.eventObservables[eventName]) {
            return;
        }

        this.eventObservables[eventName].removeCallback(callback);
    }

    public raiseEvent<T = undefined>(event: ICustomEvent<T>): void {
        if (this.eventObservables[event.name]) {
            this.eventObservables[event.name].notifyObservers(event);
        }
        this.onEventRaisedObservable.notifyObservers(event);

        if (this._parent && !event.localize) {
            this._parent.raiseEvent(event);
        }
    }

    public dispose(): void {
        for (const eventName in this.eventObservables) {
            this.eventObservables[eventName].clear();
            delete this.eventObservables[eventName];
        }
        this.onDisposeObservable.notifyObservers();
    }
}

// const eventManager = new EventManager();

// export { eventManager };
