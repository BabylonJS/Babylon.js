import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";
import type { Animatable } from "../../../Animations/animatable";
import { Animation } from "../../../Animations/animation";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Vector3 } from "../../../Maths/math.vector";
import { Quaternion } from "../../../Maths/math.vector";

export interface IRotateActionOptions extends IActionOptions {
    subject: TransformNode;
    rotationQuaternion: Quaternion; // should we support euler angles too?
    duration?: number; // in milliseconds
    pivot?: TransformNode | Vector3; // not supported currently
    space?: TransformNode | Vector3; // not supported currently
    easing?: number; // TODO
}

export class RotateAction extends BaseAction<IRotateActionOptions> {
    private _animatable: Animatable;

    protected async _execute(): Promise<void> {
        if (!this._options.subject) {
            return;
        }
        return new Promise((resolve) => {
            const frameRate = 100;
            const rotateAnimation = new Animation("rotate", "rotationQuaternion", frameRate, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
            const fromQuat = this._options.subject.rotationQuaternion?.clone() ?? new Quaternion();
            const toQuat = fromQuat.multiply(this._options.rotationQuaternion.clone() ?? new Quaternion());
            console.log(fromQuat, toQuat);
            rotateAnimation.setKeys([
                {
                    frame: 0,
                    value: fromQuat,
                },
                {
                    frame: frameRate,
                    value: toQuat,
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
