import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";
import type { Animatable } from "../../../Animations/animatable";
import { Animation } from "../../../Animations/animation";
import type { TransformNode } from "../../../Meshes/transformNode";
import { Vector3 } from "../../../Maths/math.vector";

export interface ITranslateActionOptions extends IActionOptions {
    subject: TransformNode;
    translation: Vector3; // should we support euler angles too?
    duration?: number; // in milliseconds
    space?: TransformNode | Vector3; // not supported currently
    easing?: number; // TODO
}

export class TranslateAction extends BaseAction<ITranslateActionOptions> {
    private _animatable: Animatable;

    protected async _execute(): Promise<void> {
        if (!this._options.subject) {
            return;
        }
        return new Promise((resolve) => {
            const frameRate = 100;
            const rotateAnimation = new Animation("translate", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
            rotateAnimation.setKeys([
                {
                    frame: 0,
                    value: this._options.subject.position.clone() ?? new Vector3(),
                },
                {
                    frame: frameRate,
                    value: this._options.translation.clone() ?? new Vector3(),
                },
            ]);
            this._animatable = this._options.subject
                .getScene()
                .beginDirectAnimation(this._options.subject, [rotateAnimation], 0, frameRate, false, 1000 / (this._options.duration || 1000), resolve);
        });
    }

    protected _stop(): void {
        this._animatable.stop();
    }

    protected _pause(): void {
        this._animatable.pause();
    }

    protected _resume(): void {
        this._animatable.restart();
    }
}
