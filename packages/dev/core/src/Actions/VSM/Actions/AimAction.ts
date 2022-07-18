import type { Vector3 } from "../../../Maths/math.vector";
import { AdvancedTimer } from "../../../Misc/timer";
import type { Scene } from "../../../scene";
import type { Space } from "../../../Maths/math.axis";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";

export interface IAimActionOptions extends IActionOptions {
    subject: TransformNode;
    target: TransformNode;
    direction?: Vector3;
    space?: Space;
    duration?: number;
    amount?: number;
    transitionTime?: number;
    // easing - TODO
    // pingPong - what's a good way of implementing that?
}

export class AimAction extends BaseAction<IAimActionOptions> {
    private _timer: AdvancedTimer<Scene>;
    protected async _execute(): Promise<void> {
        return new Promise((resolve) => {
            // TODO if transitionTime is set (i.e. not 0 or undefined), we need to animate the rotation
            this._timer = new AdvancedTimer<Scene>({
                contextObservable: this._options.subject.getScene().onBeforeRenderObservable,
                timeout: this._options.duration ?? 1,
                onTick: () => {
                    this._options.subject.lookAt(this._options.target.position);
                },
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
