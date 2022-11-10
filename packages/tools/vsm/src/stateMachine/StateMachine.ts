/**
 * Represents the notion of a State machine with states and transitions
 * between them.
 */

import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";
import { ActionCoordinator } from "../actions/ActionCoordinator";
import { ExecuteCodeAction } from "../actions/actions/ExecuteCodeAction";
import { ClickTrigger } from "../actions/triggers/ClickTrigger";
import type { State } from "./State";

/**
 * The State Machine is responsible for switching between various states based on
 * triggers.
 */
export class StateMachine {
    private _transitions: Record<string, State> = {};
    private _actionCoordinator: ActionCoordinator;
    private _currentState: State;
    private _startingState: State;
    private _states: State[] = [];

    constructor(scene: Scene, mesh: AbstractMesh) {
        this._actionCoordinator = new ActionCoordinator(scene);

        const pointerTrigger = new ClickTrigger(mesh);
        const stateChangeAction = new ExecuteCodeAction(() => {
            this._transitionStates();
        });

        this._actionCoordinator.addBehavior(pointerTrigger, stateChangeAction);
    }

    private _transitionStates() {
        if (this._currentState.canLeaveState()) {
            const possibleNext = this._transitions[this._currentState.id];
            if (possibleNext?.canEnterState()) {
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
        return this._states;
    }

    getStateById(id: string) {
        return this._states.find((state) => state.id === id);
    }

    getTransitions() {
        return Object.entries(this._transitions);
    }

    addState(state: State) {
        this._states.push(state);
    }

    addTransition(from: State, to: State) {
        if (this._states.indexOf(from) === -1 || this._states.indexOf(to) === -1) {
            Tools.Warn("Trying to add a transition betweens states that don't exist");
            return;
        }
        this._transitions[from.id] = to;
    }

    removeTransition(from: State, to: State) {
        if (this._states.indexOf(from) === -1 || this._states.indexOf(to) === -1) {
            Tools.Warn("Trying to remove a transition betweens states that don't exist");
            return;
        }
        if (!this._transitions[from.id]) {
            Tools.Warn("Trying to remove a transition that doesn't exist");
        }
        delete this._transitions[from.id];
    }

    removeState(state: State) {
        if (state === this._startingState || state === this._currentState) {
            Tools.Warn("Trying to remove starting or current state");
            return;
        }
        this._states.splice(this._states.indexOf(state), 1);
        delete this._transitions[state.id];
        for (const [key, value] of Object.entries(this._transitions)) {
            if (value === state) {
                delete this._transitions[key];
            }
        }
    }

    setStartingState(state: State) {
        this._startingState = state;
    }

    start() {
        if (!this._startingState) {
            Tools.Warn("No starting state set for state machine");
            return;
        }
        this._currentState = this._startingState;
        this._startingState.enterState();
        this._actionCoordinator.start();
    }

    pause() {
        /**
         * No op for now
         */
    }
}
