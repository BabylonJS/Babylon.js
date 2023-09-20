import { Observable } from "../Misc/observable";
import type { FlowGraphCustomEvent } from "./flowGraphCustomEvent";

/**
 * This class centralizes the handling of events in the flow graph.
 * If a block fires an event, it will be handled by this class.
 * It will also notify any blocks that are listening to that event.
 * @experimental
 */
export class FlowGraphEventCoordinator {
    private _customEventsMap: Map<string, Observable<FlowGraphCustomEvent>> = new Map();

    /**
     * Get an observable that will be notified when the event with the given id is fired.
     * @param id the id of the event
     * @returns the observable for the event
     */
    getCustomEventObservable(id: string): Observable<FlowGraphCustomEvent> {
        let observable = this._customEventsMap.get(id);
        if (!observable) {
            observable = new Observable<FlowGraphCustomEvent>();
            this._customEventsMap.set(id, observable);
        }
        return observable;
    }

    /**
     * Notifies the observable for the given event id with the given data.
     * @param id the id of the event
     * @param data the data to send with the event
     */
    notifyCustomEvent(id: string, data: any) {
        const observable = this._customEventsMap.get(id);
        if (observable) {
            observable.notifyObservers(data);
        }
    }
}
