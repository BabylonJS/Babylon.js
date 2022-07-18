import type { BaseAction, IActionOptions } from "./Actions/BaseAction";
import type { BaseTrigger } from "./Triggers/BaseTrigger";

export enum BehaviorRepetitionMode {
    RESTART = 0,
    IGNORE = 1,
    QUEUE = 2,
}

export interface IBehaviorOptions {
    repetitionMode?: BehaviorRepetitionMode;
}

export class BaseBehavior {
    public enabled = true;
    constructor(private _trigger: BaseTrigger, private _action: BaseAction<IActionOptions>, private _options: IBehaviorOptions = {}) {
        this._trigger.onTriggeredObservable.add(() => {
            if (this.enabled) {
                this._checkExecution();
            }
        });
    }

    public stop() {
        this._action.stop();
    }

    public pause() {
        this._action.pause();
    }

    public resume() {
        this._action.resume();
    }

    private _checkExecution() {
        switch (this._options.repetitionMode) {
            case 0:
                this._action.stop();
                this._action.execute();
                break;
            case 2:
                if (this._action.isRunning) {
                    this._action.nextActions.unshift(this._action);
                }
                break;
            case 1:
            default:
                if (!this._action.isRunning) {
                    this._action.execute();
                }
                break;
        }
    }
}
