import type { Animation } from "../../../Animations/animation";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";
import { AnimationGroup } from "../../../Animations/animationGroup";

export interface IHideActionOptions extends IActionOptions {
    subject: TransformNode;
    duration?: number;
    hideAnimation?: Animation;
    applyAnimationToChildren?: boolean;
}

export class HideAction extends BaseAction<IHideActionOptions> {
    private _animationGroup: AnimationGroup;
    protected async _execute(): Promise<void> {
        return new Promise((resolve) => {
            const onEnd = () => {
                this._options.subject.setEnabled(false);
                resolve();
            };
            if (this._options.hideAnimation) {
                const scene = this._options.subject.getScene();
                const actOn = this._options.applyAnimationToChildren ? this._options.subject.getChildMeshes() : [this._options.subject];
                this._animationGroup = new AnimationGroup("hide-animation-group", scene);
                actOn.forEach((node) => {
                    this._animationGroup.addTargetedAnimation(this._options.hideAnimation!, node);
                });
                this._animationGroup.normalize(0, 100);
                this._animationGroup.onAnimationGroupEndObservable.add(onEnd);
                this._animationGroup.speedRatio = 1000 / (this._options.duration || 1000);
                this._animationGroup.play();
            } else {
                onEnd();
            }
        });
    }

    protected _stop(): void {
        this._animationGroup && this._animationGroup.stop();
    }

    protected _pause(): void {
        this._animationGroup && this._animationGroup.pause();
    }

    protected _resume(): void {
        // TODO - is this resume?
        this._animationGroup && this._animationGroup.play();
    }
}
