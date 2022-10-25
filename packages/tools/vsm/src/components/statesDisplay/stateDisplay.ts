import { Color3 } from "core/Maths/math.color";
import type { State } from "../../stateMachine/State";

/**
 * This class wraps a State with display information
 */
export class StateDisplay {
    private _state: State;
    private _color: Color3;

    constructor(state: State) {
        this._state = state;
        this._color = Color3.Random();
    }

    get state() {
        return this._state;
    }

    get color() {
        return this._color.toHexString();
    }
}
