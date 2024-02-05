import { Observable } from "../Misc/observable";
import { Vector2, Vector3 } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import type { Condition } from "./condition";
import { RegisterClass } from "../Misc/typeStore";
import type { AbstractActionManager } from "./abstractActionManager";
import type { Nullable } from "../types";
import type { Material } from "../Materials/material";

import type { Scene } from "../scene";
import type { ActionManager } from "./actionManager";
import type { ActionEvent } from "./actionEvent";
import type { Mesh } from "../Meshes/mesh";
import type { Light } from "../Lights/light";
import type { Camera } from "../Cameras/camera";
import type { Node } from "../node";

/**
 * Interface used to define Action
 */
export interface IAction {
    /**
     * Trigger for the action
     */
    trigger: number;

    /** Options of the trigger */
    triggerOptions: any;

    /**
     * Gets the trigger parameters
     * @returns the trigger parameters
     */
    getTriggerParameter(): any;

    /**
     * Internal only - executes current action event
     * @internal
     */
    _executeCurrent(evt?: ActionEvent): void;

    /**
     * Serialize placeholder for child classes
     * @param parent of child
     * @returns the serialized object
     */
    serialize(parent: any): any;

    /**
     * Internal only
     * @internal
     */
    _prepare(): void;

    /**
     * Internal only - manager for action
     * @internal
     */
    _actionManager: Nullable<AbstractActionManager>;

    /**
     * Adds action to chain of actions, may be a DoNothingAction
     * @param action defines the next action to execute
     * @returns The action passed in
     * @see https://www.babylonjs-playground.com/#1T30HR#0
     */
    then(action: IAction): IAction;
}

/**
 * The action to be carried out following a trigger
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#available-actions
 */
export class Action implements IAction {
    /**
     * Trigger for the action
     */
    public trigger: number;

    /**
     * Internal only - manager for action
     * @internal
     */
    public _actionManager: ActionManager;

    private _nextActiveAction: Action;
    private _child: Action;
    private _condition?: Condition;
    private _triggerParameter: any;

    /**
     * An event triggered prior to action being executed.
     */
    public onBeforeExecuteObservable = new Observable<Action>();

    /**
     * Creates a new Action
     * @param triggerOptions the trigger, with or without parameters, for the action
     * @param condition an optional determinant of action
     */
    constructor(
        /** the trigger, with or without parameters, for the action */
        public triggerOptions: any,
        condition?: Condition
    ) {
        if (triggerOptions.parameter) {
            this.trigger = triggerOptions.trigger;
            this._triggerParameter = triggerOptions.parameter;
        } else if (triggerOptions.trigger) {
            this.trigger = triggerOptions.trigger;
        } else {
            this.trigger = triggerOptions;
        }

        this._nextActiveAction = this;
        this._condition = condition;
    }

    /**
     * Internal only
     * @internal
     */
    public _prepare(): void {}

    /**
     * Gets the trigger parameter
     * @returns the trigger parameter
     */
    public getTriggerParameter(): any {
        return this._triggerParameter;
    }

    /**
     * Sets the trigger parameter
     * @param value defines the new trigger parameter
     */
    public setTriggerParameter(value: any) {
        this._triggerParameter = value;
    }

    /**
     * Internal only - Returns if the current condition allows to run the action
     * @internal
     */
    public _evaluateConditionForCurrentFrame(): boolean {
        const condition = this._condition;
        if (!condition) {
            return true;
        }

        const currentRenderId = this._actionManager.getScene().getRenderId();

        // We cache the current evaluation for the current frame
        if (condition._evaluationId !== currentRenderId) {
            condition._evaluationId = currentRenderId;
            condition._currentResult = condition.isValid();
        }

        return condition._currentResult;
    }

    /**
     * Internal only - executes current action event
     * @internal
     */
    public _executeCurrent(evt?: ActionEvent): void {
        const isConditionValid = this._evaluateConditionForCurrentFrame();
        if (!isConditionValid) {
            return;
        }

        this.onBeforeExecuteObservable.notifyObservers(this);
        this._nextActiveAction.execute(evt);

        this.skipToNextActiveAction();
    }

    /**
     * Execute placeholder for child classes
     * @param evt optional action event
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public execute(evt?: ActionEvent): void {}

    /**
     * Skips to next active action
     */
    public skipToNextActiveAction(): void {
        if (this._nextActiveAction._child) {
            if (!this._nextActiveAction._child._actionManager) {
                this._nextActiveAction._child._actionManager = this._actionManager;
            }

            this._nextActiveAction = this._nextActiveAction._child;
        } else {
            this._nextActiveAction = this;
        }
    }

    /**
     * Adds action to chain of actions, may be a DoNothingAction
     * @param action defines the next action to execute
     * @returns The action passed in
     * @see https://www.babylonjs-playground.com/#1T30HR#0
     */
    public then(action: Action): Action {
        this._child = action;

        action._actionManager = this._actionManager;
        action._prepare();

        return action;
    }

    /**
     * Internal only
     * @internal
     */
    public _getProperty(propertyPath: string): string {
        return this._actionManager._getProperty(propertyPath);
    }

    /**
     * @internal
     */
    public _getEffectiveTarget(target: any, propertyPath: string): any {
        return this._actionManager._getEffectiveTarget(target, propertyPath);
    }

    /**
     * Serialize placeholder for child classes
     * @param parent of child
     * @returns the serialized object
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public serialize(parent: any): any {
        return null;
    }

    /**
     * Internal only called by serialize
     * @internal
     */
    protected _serialize(serializedAction: any, parent?: any): any {
        const serializationObject: any = {
            type: 1,
            children: [],
            name: serializedAction.name,
            properties: serializedAction.properties || [],
        };

        // Serialize child
        if (this._child) {
            this._child.serialize(serializationObject);
        }

        // Check if "this" has a condition
        if (this._condition) {
            const serializedCondition = this._condition.serialize();
            serializedCondition.children.push(serializationObject);

            if (parent) {
                parent.children.push(serializedCondition);
            }
            return serializedCondition;
        }

        if (parent) {
            parent.children.push(serializationObject);
        }
        return serializationObject;
    }

    /**
     * Internal only
     * @internal
     */
    public static _SerializeValueAsString = (value: any): string => {
        if (typeof value === "number") {
            return value.toString();
        }

        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }

        if (value instanceof Vector2) {
            return value.x + ", " + value.y;
        }
        if (value instanceof Vector3) {
            return value.x + ", " + value.y + ", " + value.z;
        }

        if (value instanceof Color3) {
            return value.r + ", " + value.g + ", " + value.b;
        }
        if (value instanceof Color4) {
            return value.r + ", " + value.g + ", " + value.b + ", " + value.a;
        }

        return value; // string
    };

    /**
     * Internal only
     * @internal
     */
    public static _GetTargetProperty = (target: Scene | Node | Material) => {
        return {
            name: "target",
            targetType: (<Mesh>target)._isMesh
                ? "MeshProperties"
                : (<Light>target)._isLight
                  ? "LightProperties"
                  : (<Camera>target)._isCamera
                    ? "CameraProperties"
                    : (<Material>target)._isMaterial
                      ? "MaterialProperties"
                      : "SceneProperties",
            value: (<Scene>target)._isScene ? "Scene" : (<Node>target).name,
        };
    };
}

RegisterClass("BABYLON.Action", Action);
