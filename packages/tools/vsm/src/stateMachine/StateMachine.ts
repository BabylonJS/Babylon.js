/**
 * Represents the notion of a State machine with states and transitions
 * between them.
 */

import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Scene } from "core/scene";
import { ActionManager } from "../actions/ActionManager";
import type { BaseAction } from "../actions/actions/BaseAction";
import { ExecuteCodeAction } from "../actions/actions/ExecuteCodeAction";
import { ClickTrigger } from "../actions/triggers/ClickTrigger";
import { OnStateEnterTrigger } from "../actions/triggers/OnStateEnterTrigger";
import type { State } from "./State";

export class StateMachine {
    private _transitions: Record<string, string> = {};
    private _actionManager: ActionManager;
    private _currentState: State;
    private _startingState: State;

    constructor(scene: Scene, mesh: AbstractMesh) {
        this._actionManager = new ActionManager(scene);

        const pointerTrigger = new ClickTrigger(mesh);
        const stateChangeAction = new ExecuteCodeAction(() => {
            this._transitionStates();
        });

        this._actionManager.addBehavior(pointerTrigger, stateChangeAction);
    }

    private _transitionStates() {
        this._currentState = this._transitions[this._currentState];
    }

    get currentState() {
        return this._currentState;
    }

    addTransition(from: State, to: State) {
        this._transitions[from] = to;
    }

    setStartingState(state: State) {
        this._startingState = state;
    }

    setStateAction(state: State, action: BaseAction) {
        const stateEnterTrigger = new OnStateEnterTrigger(this, state);
        this._actionManager.addBehavior(stateEnterTrigger, action);
    }

    start() {
        this._currentState = this._startingState;
        this._actionManager.start();
    }
}
