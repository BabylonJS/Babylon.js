import type { Animation } from "../../../Animations/animation";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";
import { AnimationGroup } from "../../../Animations/animationGroup";

export interface IShowActionOptions extends IActionOptions {
    subject: TransformNode;
    duration?: number;
    animation?: Animation;
    applyAnimationToChildren?: boolean;
}

export class ShowAction extends BaseAction<IShowActionOptions> {
    private _animationGroup: AnimationGroup;
    protected async _execute(): Promise<void> {
        this._options.subject.setEnabled(true);
        if (!this._options.animation) {
            return;
        } else {
            // animate and resolve when done
            return new Promise((resolve) => {
                const scene = this._options.subject.getScene();
                const actOn = this._options.applyAnimationToChildren ? this._options.subject.getChildMeshes() : [this._options.subject];
                this._animationGroup = new AnimationGroup("hide-animation-group", scene);
                actOn.forEach((node) => {
                    this._animationGroup.addTargetedAnimation(this._options.animation!, node);
                });
                // this._animationGroup.normalize(0, 100);
                this._animationGroup.onAnimationGroupEndObservable.add(() => resolve());
                this._animationGroup.speedRatio = 1000 / (this._options.duration || 1000);
                console.log(this._animationGroup.speedRatio);
                this._animationGroup.play();
            });
        }
    }

    protected _stop(): void {
        this._animationGroup && this._animationGroup.stop();
    }

    protected _pause(): void {
        this._animationGroup && this._animationGroup.pause();
    }

    protected _resume(): void {
        this._animationGroup && this._animationGroup.play();
    }
}
