import { Animation } from "../../../Animations/animation";
import { Animatable } from "../../../Animations/animatable";
import { TransformNode } from "../../../Meshes/transformNode";
import { BaseAction } from "./BaseAction";

export interface IShowActionOptions {
    subject: TransformNode;
    animation?: Animation;
    applyAnimationToChildren?: boolean;
}

export class ShowAction extends BaseAction<IShowActionOptions> {
    private _animatable: Animatable;
    protected async _execute(): Promise<void> {
        return new Promise((resolve) => {
            this._options.subject.setEnabled(true);
            if (this._options.animation) {
                const scene = this._options.subject.getScene();
                this._animatable = scene.beginAnimation(this._options.subject, 0, 100, false, 1, () => {
                    this._options.subject.animations.pop();
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    protected _stop(): void {
        this._animatable && this._animatable.stop();
    }

    protected _pause(): void {
        this._animatable && this._animatable.pause();
    }

    protected _resume(): void {
        this._animatable && this._animatable.restart();
    }
}
