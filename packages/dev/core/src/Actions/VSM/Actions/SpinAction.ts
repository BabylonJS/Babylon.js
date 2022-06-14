import { Space } from "../../../Maths/math.axis";
import { Vector3 } from "../../../Maths/math.vector";
import { TransformNode } from "../../../Meshes/transformNode";
import { BaseAction } from "./BaseAction";

export interface ISpinActionOptions {
    subject: TransformNode;
    direction?: Vector3;
    space?: Space;
    duration?: number;
    amount?: number;
    delay?: number;
    // easing - TODO
    repeat?: number;
    // pingPong - what's a good way of implementing that?
}

export class SpinAction extends BaseAction<ISpinActionOptions> {
    private _cancelRun = false;
    protected async _execute(): Promise<void> {
        return new Promise((resolve) => {
            if (!this._options.subject) {
                resolve();
                return;
            }
            const rotatePerFrame = Math.PI / 120;
            let rotated = 0;
            this._runAgainTimes = Number.MAX_SAFE_INTEGER;
            const observer = this._options.subject.getScene().onBeforeRenderObservable.add(() => {
                this._options.subject.rotate(this._options.direction || Vector3.UpReadOnly, rotatePerFrame, this._options.space);
                rotated += rotatePerFrame;
                // TODO - this will rotate one extra frame. Question to the specs?
                if (rotated >= Math.PI * 2 || this._cancelRun) {
                    this._options.subject.getScene().onBeforeRenderObservable.remove(observer);
                    resolve();
                }
            });
        });
    }

    protected _stop(): void {
        this._cancelRun = true;
    }
}
