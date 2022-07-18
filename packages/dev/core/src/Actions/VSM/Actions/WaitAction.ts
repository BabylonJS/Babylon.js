import { AdvancedTimer } from "../../../Misc/timer";
import type { Observable } from "../../../Misc/observable";
import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";

export interface IWaitActionOptions extends IActionOptions {
    duration?: number;
    timeMeasuringObservable: Observable<any>;
}

export class WaitAction extends BaseAction<IWaitActionOptions> {
    private _timer: AdvancedTimer<void>;
    protected async _execute(): Promise<void> {
        return new Promise((resolve) => {
            this._timer = new AdvancedTimer<void>({
                contextObservable: this._options.timeMeasuringObservable,
                timeout: this._options.duration ?? 1,
                onEnded: () => {
                    resolve();
                },
            });
        });
    }

    protected _stop(): void {
        this._timer.stop();
    }

    protected _pause(): void {
        this._timer.pause();
    }

    protected _resume(): void {
        this._timer.resume();
    }
}
