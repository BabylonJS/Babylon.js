import { Action } from "./action";
import { Condition } from "./condition";

import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { Color3 } from "../Maths/math.color";
import { Vector3, Matrix, Quaternion } from "../Maths/math.vector";
import { Animation } from "../Animations/animation";
import { _TypeStore } from '../Misc/typeStore';

/**
 * This defines an action responsible to change the value of a property
 * by interpolating between its current value and the newly set one once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class InterpolateValueAction extends Action {
    /**
     * Defines the path of the property where the value should be interpolated
     */
    public propertyPath: string;

    /**
     * Defines the target value at the end of the interpolation.
     */
    public value: any;

    /**
     * Defines the time it will take for the property to interpolate to the value.
     */
    public duration: number = 1000;

    /**
     * Defines if the other scene animations should be stopped when the action has been triggered
     */
    public stopOtherAnimations?: boolean;

    /**
     * Defines a callback raised once the interpolation animation has been done.
     */
    public onInterpolationDone?: () => void;

    /**
     * Observable triggered once the interpolation animation has been done.
     */
    public onInterpolationDoneObservable = new Observable<InterpolateValueAction>();

    private _target: any;
    private _effectiveTarget: any;
    private _property: string;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the object containing the value to interpolate
     * @param propertyPath defines the path to the property in the target object
     * @param value defines the target value at the end of the interpolation
     * @param duration deines the time it will take for the property to interpolate to the value.
     * @param condition defines the trigger related conditions
     * @param stopOtherAnimations defines if the other scene animations should be stopped when the action has been triggered
     * @param onInterpolationDone defines a callback raised once the interpolation animation has been done
     */
    constructor(triggerOptions: any, target: any, propertyPath: string, value: any, duration: number = 1000, condition?: Condition, stopOtherAnimations?: boolean, onInterpolationDone?: () => void) {
        super(triggerOptions, condition);

        this.propertyPath = propertyPath;
        this.value = value;
        this.duration = duration;
        this.stopOtherAnimations = stopOtherAnimations;
        this.onInterpolationDone = onInterpolationDone;
        this._target = this._effectiveTarget = target;
    }

    /** @hidden */
    public _prepare(): void {
        this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);
    }

    /**
     * Execute the action starts the value interpolation.
     */
    public execute(): void {
        var scene = this._actionManager.getScene();
        var keys = [
            {
                frame: 0,
                value: this._effectiveTarget[this._property]
            }, {
                frame: 100,
                value: this.value
            }
        ];

        var dataType: number;

        if (typeof this.value === "number") {
            dataType = Animation.ANIMATIONTYPE_FLOAT;
        } else if (this.value instanceof Color3) {
            dataType = Animation.ANIMATIONTYPE_COLOR3;
        } else if (this.value instanceof Vector3) {
            dataType = Animation.ANIMATIONTYPE_VECTOR3;
        } else if (this.value instanceof Matrix) {
            dataType = Animation.ANIMATIONTYPE_MATRIX;
        } else if (this.value instanceof Quaternion) {
            dataType = Animation.ANIMATIONTYPE_QUATERNION;
        } else {
            Logger.Warn("InterpolateValueAction: Unsupported type (" + typeof this.value + ")");
            return;
        }

        var animation = new Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, Animation.ANIMATIONLOOPMODE_CONSTANT);

        animation.setKeys(keys);

        if (this.stopOtherAnimations) {
            scene.stopAnimation(this._effectiveTarget);
        }

        let wrapper = () => {
            this.onInterpolationDoneObservable.notifyObservers(this);
            if (this.onInterpolationDone) {
                this.onInterpolationDone();
            }
        };

        scene.beginDirectAnimation(this._effectiveTarget, [animation], 0, 100, false, 1, wrapper);
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "InterpolateValueAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath },
                { name: "value", value: Action._SerializeValueAsString(this.value) },
                { name: "duration", value: Action._SerializeValueAsString(this.duration) },
                { name: "stopOtherAnimations", value: Action._SerializeValueAsString(this.stopOtherAnimations) || false }
            ]
        }, parent);
    }
}

_TypeStore.RegisteredTypes["BABYLON.InterpolateValueAction"] = InterpolateValueAction;
