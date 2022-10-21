import type { State } from "../../stateMachine/State";
import type { StateMachine } from "../../stateMachine/StateMachine";
import { BaseTrigger } from "./BaseTrigger";

export class OnStateEnterTrigger extends BaseTrigger {
    private _stateMachine: StateMachine;
    private _previousState: State;
    private _stateToMove: State;

    constructor(stateMachine: StateMachine, stateToMove: State) {
        super();
        this._stateMachine = stateMachine;
        this._stateToMove = stateToMove;
        this._previousState = stateMachine.currentState;
    }

    public condition(): boolean {
        const currentState = this._stateMachine.currentState;
        if (currentState === this._stateToMove && currentState !== this._previousState) {
            this._previousState = this._stateMachine.currentState;
            return true;
        }
        this._previousState = this._stateMachine.currentState;
        return false;
    }
}
