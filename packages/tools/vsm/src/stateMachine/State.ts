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

    constructor(name: string) {
        this._name = name;
        this._id = IDS++ + "";
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
        this._stateEnterAction.execute();
        this._phase = StatePhases.READY;
    }

    leaveState() {
        this._phase = StatePhases.LEFT;
    }

    canLeaveState() {
        return this._phase === StatePhases.READY;
    }

    canEnterState() {
        return this._phase == StatePhases.LEFT;
    }
}
