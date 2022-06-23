import { Animation } from "../../../Animations/animation";
import { TransformNode } from "../../../Meshes/transformNode";
import { BaseAction } from "./BaseAction";
import { AnimationGroup } from "../../../Animations/animationGroup";

export interface IShowActionOptions {
    subject: TransformNode;
    animation?: Animation;
    applyAnimationToChildren?: boolean;
}

export class ShowAction extends BaseAction<IShowActionOptions> {
    private _animationGroup: AnimationGroup;
    protected async _execute(): Promise<void> {
        return new Promise((resolve) => {
            this._options.subject.setEnabled(true);
            if (this._options.animation) {
                const scene = this._options.subject.getScene();
                const actOn = this._options.applyAnimationToChildren ? this._options.subject.getChildMeshes() : [this._options.subject];
                this._animationGroup = new AnimationGroup("hide-animation-group", scene);
                actOn.forEach((node) => {
                    this._animationGroup.addTargetedAnimation(this._options.animation!, node);
                });
                this._animationGroup.normalize(0, 100);
                this._animationGroup.onAnimationGroupEndObservable.add(() => resolve());
                this._animationGroup.play();
            } else {
                resolve();
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
        this._animationGroup && this._animationGroup.play();
    }
}
