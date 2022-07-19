import { AdvancedTimer } from "../../../Misc/timer";
import type { Space } from "../../../Maths/math.axis";
import { Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";
import type { Scene } from "../../../scene";

export interface ISpinActionOptions extends IActionOptions {
    subject: TransformNode;
    // target?: TransformNode | Vector3;
    direction?: Vector3;
    space?: Space;
    duration?: number; // in miliseconds
    amount?: number;
    playCount?: number;
    // easing - TODO
    // pingPong - what's a good way of implementing that?
}

export class SpinAction extends BaseAction<ISpinActionOptions> {
    private _timer: AdvancedTimer<Scene>;
    protected async _execute(): Promise<void> {
        if (!this._options.subject) {
            return;
        }
        return new Promise((resolve) => {
            const timeout = this._options.duration ?? 1000;
            this._timer = new AdvancedTimer<Scene>({
                contextObservable: this._options.subject.getScene().onBeforeRenderObservable,
                timeout: timeout,
                onTick: (data) => {
                    let amountRotated = 0;
                    let amountToRotate = (data.timeSincePreviousTick / timeout) * Math.PI * 2;
                    if (amountRotated + amountToRotate > Math.PI * 2) {
                        amountToRotate = Math.PI * 2 - amountRotated;
                    }
                    this._options.subject.rotate(this._options.direction || Vector3.UpReadOnly, amountToRotate, this._options.space);
                    amountRotated += amountToRotate;
                },
                onEnded: () => {
                    resolve();
                },
            });
            this._timer.start();
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
