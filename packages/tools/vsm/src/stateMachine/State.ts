import { Observable } from "core/Misc/observable";
import type { BaseAction } from "../actions/actions/BaseAction";

export enum StatePhases {
    ENTER = "entered",
    READY = "ready",
    LEFT = "left",
}

let IDS = 0;

/**
 * Each State is composed by two "phases" of actions:
 * Entering a state will start the first "phase", which
 * once executed will inform the state is "ready". The second
 * phase starts once the state will be moved out of
 */
export class State {
    private _name: string;
    private _id: string;
    private _stateEnterAction: BaseAction;
    private _phase: StatePhases = StatePhases.LEFT;
    private _onStateEnteredObservable = new Observable<State>();
    private _onStateLeftObservable = new Observable<State>();

    constructor(name: string) {
        this._name = name;
        this._id = IDS++ + "";
        this._onStateEnteredObservable = new Observable<State>();
        this._onStateLeftObservable = new Observable<State>();
    }

    get onStateEnteredObservable() {
        return this._onStateEnteredObservable;
    }

    get onStateLeftObservable() {
        return this._onStateLeftObservable;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get stateEnterAction() {
        return this._stateEnterAction;
    }

    setOnStateEnterAction(action: BaseAction) {
        this._stateEnterAction = action;
    }

    enterState() {
        this._phase = StatePhases.ENTER;
        this._onStateEnteredObservable.notifyObservers(this);
        this._stateEnterAction.execute();
        this._phase = StatePhases.READY;
    }

    leaveState() {
        this._phase = StatePhases.LEFT;
        this._onStateLeftObservable.notifyObservers(this);
    }

    canLeaveState() {
        return this._phase === StatePhases.READY;
    }

    canEnterState() {
        return this._phase == StatePhases.LEFT;
    }
}
