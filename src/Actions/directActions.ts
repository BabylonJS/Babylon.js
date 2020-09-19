import { Logger } from "../Misc/logger";
import { Vector3 } from "../Maths/math.vector";
import { Action } from "./action";
import { Condition } from "./condition";
import { Constants } from "../Engines/constants";
import { _TypeStore } from '../Misc/typeStore';

declare type ActionEvent = import("./actionEvent").ActionEvent;

/**
 * This defines an action responsible to toggle a boolean once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class SwitchBooleanAction extends Action {
    /**
     * The path to the boolean property in the target object
     */
    public propertyPath: string;

    private _target: any;
    private _effectiveTarget: any;
    private _property: string;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the object containing the boolean
     * @param propertyPath defines the path to the boolean property in the target object
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, propertyPath: string, condition?: Condition) {
        super(triggerOptions, condition);
        this.propertyPath = propertyPath;
        this._target = this._effectiveTarget = target;
    }

    /** @hidden */
    public _prepare(): void {
        this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);
    }

    /**
     * Execute the action toggle the boolean value.
     */
    public execute(): void {
        this._effectiveTarget[this._property] = !this._effectiveTarget[this._property];
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "SwitchBooleanAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath }
            ]
        }, parent);
    }
}

/**
 * This defines an action responsible to set a the state field of the target
 *  to a desired value once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class SetStateAction extends Action {
    /**
     * The value to store in the state field.
     */
    public value: string;

    private _target: any;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the object containing the state property
     * @param value defines the value to store in the state field
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, value: string, condition?: Condition) {
        super(triggerOptions, condition);
        this.value = value;
        this._target = target;
    }

    /**
     * Execute the action and store the value on the target state property.
     */
    public execute(): void {
        this._target.state = this.value;
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "SetStateAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "value", value: this.value }
            ]
        }, parent);
    }
}

/**
 * This defines an action responsible to set a property of the target
 *  to a desired value once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class SetValueAction extends Action {
    /**
     * The path of the property to set in the target.
     */
    public propertyPath: string;

    /**
     * The value to set in the property
     */
    public value: any;

    private _target: any;
    private _effectiveTarget: any;
    private _property: string;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the object containing the property
     * @param propertyPath defines the path of the property to set in the target
     * @param value defines the value to set in the property
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition) {
        super(triggerOptions, condition);
        this.propertyPath = propertyPath;
        this.value = value;
        this._target = this._effectiveTarget = target;
    }

    /** @hidden */
    public _prepare(): void {
        this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);
    }

    /**
     * Execute the action and set the targetted property to the desired value.
     */
    public execute(): void {
        this._effectiveTarget[this._property] = this.value;

        if (this._target.markAsDirty) {
            this._target.markAsDirty(this._property);
        }
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "SetValueAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath },
                { name: "value", value: Action._SerializeValueAsString(this.value) }
            ]
        }, parent);
    }
}

/**
 * This defines an action responsible to increment the target value
 *  to a desired value once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class IncrementValueAction extends Action {
    /**
     * The path of the property to increment in the target.
     */
    public propertyPath: string;

    /**
     * The value we should increment the property by.
     */
    public value: any;

    private _target: any;
    private _effectiveTarget: any;
    private _property: string;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the object containing the property
     * @param propertyPath defines the path of the property to increment in the target
     * @param value defines the value value we should increment the property by
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition) {
        super(triggerOptions, condition);
        this.propertyPath = propertyPath;
        this.value = value;
        this._target = this._effectiveTarget = target;
    }

    /** @hidden */
    public _prepare(): void {
        this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);

        if (typeof this._effectiveTarget[this._property] !== "number") {
            Logger.Warn("Warning: IncrementValueAction can only be used with number values");
        }
    }

    /**
     * Execute the action and increment the target of the value amount.
     */
    public execute(): void {
        this._effectiveTarget[this._property] += this.value;

        if (this._target.markAsDirty) {
            this._target.markAsDirty(this._property);
        }
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "IncrementValueAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath },
                { name: "value", value: Action._SerializeValueAsString(this.value) }
            ]
        }, parent);
    }
}

/**
 * This defines an action responsible to start an animation once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class PlayAnimationAction extends Action {
    /**
     * Where the animation should start (animation frame)
     */
    public from: number;

    /**
     * Where the animation should stop (animation frame)
     */
    public to: number;

    /**
     * Define if the animation should loop or stop after the first play.
     */
    public loop?: boolean;

    private _target: any;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the target animation or animation name
     * @param from defines from where the animation should start (animation frame)
     * @param end defines where the animation should stop (animation frame)
     * @param loop defines if the animation should loop or stop after the first play
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, from: number, to: number, loop?: boolean, condition?: Condition) {
        super(triggerOptions, condition);
        this.from = from;
        this.to = to;
        this.loop = loop;
        this._target = target;
    }

    /** @hidden */
    public _prepare(): void {
    }

    /**
     * Execute the action and play the animation.
     */
    public execute(): void {
        var scene = this._actionManager.getScene();
        scene.beginAnimation(this._target, this.from, this.to, this.loop);
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "PlayAnimationAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "from", value: String(this.from) },
                { name: "to", value: String(this.to) },
                { name: "loop", value: Action._SerializeValueAsString(this.loop) || false }
            ]
        }, parent);
    }
}

/**
 * This defines an action responsible to stop an animation once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class StopAnimationAction extends Action {
    private _target: any;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the target animation or animation name
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, condition?: Condition) {
        super(triggerOptions, condition);
        this._target = target;
    }

    /** @hidden */
    public _prepare(): void {
    }

    /**
     * Execute the action and stop the animation.
     */
    public execute(): void {
        var scene = this._actionManager.getScene();
        scene.stopAnimation(this._target);
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "StopAnimationAction",
            properties: [Action._GetTargetProperty(this._target)]
        }, parent);
    }
}

/**
 * This defines an action responsible that does nothing once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class DoNothingAction extends Action {
    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any = Constants.ACTION_NothingTrigger, condition?: Condition) {
        super(triggerOptions, condition);
    }

    /**
     * Execute the action and do nothing.
     */
    public execute(): void {
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "DoNothingAction",
            properties: []
        }, parent);
    }
}

/**
 * This defines an action responsible to trigger several actions once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class CombineAction extends Action {
    /**
     * The list of aggregated animations to run.
     */
    public children: Action[];

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param children defines the list of aggregated animations to run
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, children: Action[], condition?: Condition) {
        super(triggerOptions, condition);
        this.children = children;
    }

    /** @hidden */
    public _prepare(): void {
        for (var index = 0; index < this.children.length; index++) {
            this.children[index]._actionManager = this._actionManager;
            this.children[index]._prepare();
        }
    }

    /**
     * Execute the action and executes all the aggregated actions.
     */
    public execute(evt: ActionEvent): void {
        for (var index = 0; index < this.children.length; index++) {
            this.children[index].execute(evt);
        }
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        var serializationObject = super._serialize({
            name: "CombineAction",
            properties: [],
            combine: []
        }, parent);

        for (var i = 0; i < this.children.length; i++) {
            serializationObject.combine.push(this.children[i].serialize(null));
        }

        return serializationObject;
    }
}

/**
 * This defines an action responsible to run code (external event) once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class ExecuteCodeAction extends Action {
    /**
     * The callback function to run.
     */
    public func: (evt: ActionEvent) => void;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param func defines the callback function to run
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, func: (evt: ActionEvent) => void, condition?: Condition) {
        super(triggerOptions, condition);
        this.func = func;
    }

    /**
     * Execute the action and run the attached code.
     */
    public execute(evt: ActionEvent): void {
        this.func(evt);
    }
}

/**
 * This defines an action responsible to set the parent property of the target once triggered.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class SetParentAction extends Action {
    private _parent: any;
    private _target: any;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the target containing the parent property
     * @param parent defines from where the animation should start (animation frame)
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, target: any, parent: any, condition?: Condition) {
        super(triggerOptions, condition);
        this._target = target;
        this._parent = parent;
    }

    /** @hidden */
    public _prepare(): void {
    }

    /**
     * Execute the action and set the parent property.
     */
    public execute(): void {
        if (this._target.parent === this._parent) {
            return;
        }

        var invertParentWorldMatrix = this._parent.getWorldMatrix().clone();
        invertParentWorldMatrix.invert();

        this._target.position = Vector3.TransformCoordinates(this._target.position, invertParentWorldMatrix);

        this._target.parent = this._parent;
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(parent: any): any {
        return super._serialize({
            name: "SetParentAction",
            properties: [
                Action._GetTargetProperty(this._target),
                Action._GetTargetProperty(this._parent),
            ]
        }, parent);
    }
}

_TypeStore.RegisteredTypes["BABYLON.SetParentAction"] = SetParentAction;
_TypeStore.RegisteredTypes["BABYLON.ExecuteCodeAction"] = ExecuteCodeAction;
_TypeStore.RegisteredTypes["BABYLON.DoNothingAction"] = DoNothingAction;
_TypeStore.RegisteredTypes["BABYLON.StopAnimationAction"] = StopAnimationAction;
_TypeStore.RegisteredTypes["BABYLON.PlayAnimationAction"] = PlayAnimationAction;
_TypeStore.RegisteredTypes["BABYLON.IncrementValueAction"] = IncrementValueAction;
_TypeStore.RegisteredTypes["BABYLON.SetValueAction"] = SetValueAction;
_TypeStore.RegisteredTypes["BABYLON.SetStateAction"] = SetStateAction;
_TypeStore.RegisteredTypes["BABYLON.SetParentAction"] = SetParentAction;