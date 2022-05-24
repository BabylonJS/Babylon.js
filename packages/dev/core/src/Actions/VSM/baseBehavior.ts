import { BaseAction } from "./Actions/BaseAction";
import { BaseTrigger } from "./Triggers/BaseTrigger";

export enum BehaviorRepetitionMode {
    RESTART = 0,
    IGNORE = 1,
    QUEUE = 2,
}

export interface IBehaviorOptions {
    repetitionMode?: BehaviorRepetitionMode;
}

export class BaseBehavior {
    constructor(private _trigger: BaseTrigger, private _action: BaseAction, private _options: IBehaviorOptions = {}) {
        this._trigger.onTriggeredObservable.add(() => {
            this._checkExecution();
        });
    }

    private _checkExecution() {
        switch (this._options.repetitionMode) {
            case 0:
                this._action.stop();
                this._action.execute();
                break;
            case 2:
                if (this._action.isRunning) {
                    this._action.nextActions.push(this._action);
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
