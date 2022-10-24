import type { Observer } from "core/Misc/observable";

export class BaseAction {
    private _triggerObservers: Observer<void>[] = [];

    public constructor() {}

    public execute() {
        /** Overriden in child classes */
    }

    public actionName(): string {
        /** Overriden in child classes */
        return "BaseAction";
    }

    public addObserver(obs: Observer<void>) {
        this._triggerObservers.push(obs);
    }
}
