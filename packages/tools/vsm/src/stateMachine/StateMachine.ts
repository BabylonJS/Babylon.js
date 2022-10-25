/**
 * Represents the notion of a State machine with states and transitions
 * between them.
 */

import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Scene } from "core/scene";
import { ActionManager } from "../actions/ActionManager";
import { ExecuteCodeAction } from "../actions/actions/ExecuteCodeAction";
import { ClickTrigger } from "../actions/triggers/ClickTrigger";
// import type { BaseAction } from "../actions/actions/BaseAction";
// import { BaseTrigger } from "../actions/triggers/BaseTrigger";
// import { OnStateEnterTrigger } from "../actions/triggers/OnStateEnterTrigger";
import type { State } from "./State";

export class StateMachine {
    private _transitions: Record<string, State> = {};
    private _actionManager: ActionManager;
    private _currentState: State;
    private _startingState: State;
    private _states: State[] = [];
    // private _states: Set<State> = new Set<State>();
    // private _stateEnterTriggers: Record<State, BaseTrigger> = {};

    constructor(scene: Scene, mesh: AbstractMesh) {
        this._actionManager = new ActionManager(scene);

        const pointerTrigger = new ClickTrigger(mesh);
        const stateChangeAction = new ExecuteCodeAction(() => {
            this._transitionStates();
        });

        this._actionManager.addBehavior(pointerTrigger, stateChangeAction);
    }

    private _transitionStates() {
        if (this._currentState.canLeaveState()) {
            const possibleNext = this._transitions[this._currentState.id];
            if (possibleNext.canEnterState()) {
                this._currentState.leaveState();
                possibleNext.enterState();
                this._currentState = possibleNext;
            }
        }
    }

    get currentState() {
        return this._currentState;
    }

    getStates() {
        // return this._states.values();
        return this._states;
    }

    getTransitions() {
        return Object.entries(this._transitions);
    }

    addState(state: State) {
        this._states.push(state);
        // this._states.add(state);
    }

    addTransition(from: State, to: State) {
        // Add state to list of states
        // this._states.add(from);
        this._transitions[from.id] = to;
    }

    setStartingState(state: State) {
        this._startingState = state;
    }

    // setStateEnterAction(state: State, action: BaseAction) {
    // const stateEnterTrigger = new OnStateEnterTrigger(this, state);
    // this._actionManager.addBehavior(stateEnterTrigger, action);
    // this._stateEnterTriggers[state] = stateEnterTrigger;
    // }

    // getStateAction(state: State) {
    //     return this._actionManager.getActionByTrigger(this._stateEnterTriggers[state]);
    // }

    start() {
        this._currentState = this._startingState;
        this._startingState.enterState();
        this._actionManager.start();
    }
}
