import { Observable } from "core/Misc/observable";

export interface IEvent<T> {
    name: string;
    localize?: boolean;
    payload?: T;
}

export class EventManager {
    public onEventRaisedObservable: Observable<IEvent<any>> = new Observable();
    public onDisposeObservable: Observable<void> = new Observable();
    public eventObservables: { [key: string]: Observable<IEvent<any>> } = {};

    constructor(private _parent: EventManager) {}

    public registerEventListener<T = undefined>(event: IEvent<T>, callback: (event: IEvent<T>) => void): void {
        if (!this.eventObservables[event.name]) {
            this.eventObservables[event.name] = new Observable();
        }

        this.eventObservables[event.name].add(callback);
    }

    public raiseEvent<T = undefined>(event: IEvent<T>): void {
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
