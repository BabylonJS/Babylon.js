import type { Nullable } from "../types";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Scene } from "../scene";
import { Vector3, Vector4 } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import { Condition, ValueCondition } from "./condition";
import type { IAction } from "./action";
import { Action } from "./action";
import { DoNothingAction } from "./directActions";

import { EngineStore } from "../Engines/engineStore";
import type { IActionEvent } from "../Actions/actionEvent";
import { Logger } from "../Misc/logger";
import { DeepCopier } from "../Misc/deepCopier";
import { GetClass } from "../Misc/typeStore";
import { AbstractActionManager } from "./abstractActionManager";
import { Constants } from "../Engines/constants";

/**
 * Action Manager manages all events to be triggered on a given mesh or the global scene.
 * A single scene can have many Action Managers to handle predefined actions on specific meshes.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export class ActionManager extends AbstractActionManager {
    /**
     * Nothing
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly NothingTrigger = Constants.ACTION_NothingTrigger;

    /**
     * On pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickTrigger = Constants.ACTION_OnPickTrigger;

    /**
     * On left pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnLeftPickTrigger = Constants.ACTION_OnLeftPickTrigger;

    /**
     * On right pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnRightPickTrigger = Constants.ACTION_OnRightPickTrigger;

    /**
     * On center pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnCenterPickTrigger = Constants.ACTION_OnCenterPickTrigger;

    /**
     * On pick down
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickDownTrigger = Constants.ACTION_OnPickDownTrigger;

    /**
     * On double pick
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnDoublePickTrigger = Constants.ACTION_OnDoublePickTrigger;

    /**
     * On pick up
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickUpTrigger = Constants.ACTION_OnPickUpTrigger;
    /**
     * On pick out.
     * This trigger will only be raised if you also declared a OnPickDown
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickOutTrigger = Constants.ACTION_OnPickOutTrigger;

    /**
     * On long press
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnLongPressTrigger = Constants.ACTION_OnLongPressTrigger;

    /**
     * On pointer over
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPointerOverTrigger = Constants.ACTION_OnPointerOverTrigger;

    /**
     * On pointer out
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPointerOutTrigger = Constants.ACTION_OnPointerOutTrigger;

    /**
     * On every frame
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnEveryFrameTrigger = Constants.ACTION_OnEveryFrameTrigger;
    /**
     * On intersection enter
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnIntersectionEnterTrigger = Constants.ACTION_OnIntersectionEnterTrigger;

    /**
     * On intersection exit
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnIntersectionExitTrigger = Constants.ACTION_OnIntersectionExitTrigger;

    /**
     * On key down
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnKeyDownTrigger = Constants.ACTION_OnKeyDownTrigger;

    /**
     * On key up
     * @see https://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnKeyUpTrigger = 15;

    // Members
    private _scene: Scene;

    /**
     * Creates a new action manager
     * @param scene defines the hosting scene
     */
    constructor(scene?: Nullable<Scene>) {
        super();
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;

        scene.actionManagers.push(this);
    }

    // Methods

    /**
     * Releases all associated resources
     */
    public dispose(): void {
        const index = this._scene.actionManagers.indexOf(this);

        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            ActionManager.Triggers[action.trigger]--;
            if (ActionManager.Triggers[action.trigger] === 0) {
                delete ActionManager.Triggers[action.trigger];
            }
        }

        if (index > -1) {
            this._scene.actionManagers.splice(index, 1);
        }
    }

    /**
     * Gets hosting scene
     * @returns the hosting scene
     */
    public getScene(): Scene {
        return this._scene;
    }

    /**
     * Does this action manager handles actions of any of the given triggers
     * @param triggers defines the triggers to be tested
     * @returns a boolean indicating whether one (or more) of the triggers is handled
     */
    public hasSpecificTriggers(triggers: number[]): boolean {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];

            if (triggers.indexOf(action.trigger) > -1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Does this action manager handles actions of any of the given triggers. This function takes two arguments for
     * speed.
     * @param triggerA defines the trigger to be tested
     * @param triggerB defines the trigger to be tested
     * @returns a boolean indicating whether one (or more) of the triggers is handled
     */
    public hasSpecificTriggers2(triggerA: number, triggerB: number): boolean {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];

            if (triggerA == action.trigger || triggerB == action.trigger) {
                return true;
            }
        }

        return false;
    }

    /**
     * Does this action manager handles actions of a given trigger
     * @param trigger defines the trigger to be tested
     * @param parameterPredicate defines an optional predicate to filter triggers by parameter
     * @returns whether the trigger is handled
     */
    public hasSpecificTrigger(trigger: number, parameterPredicate?: (parameter: any) => boolean): boolean {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];

            if (action.trigger === trigger) {
                if (parameterPredicate) {
                    if (parameterPredicate(action.getTriggerParameter())) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Does this action manager has pointer triggers
     */
    public get hasPointerTriggers(): boolean {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];

            if (action.trigger >= ActionManager.OnPickTrigger && action.trigger <= ActionManager.OnPointerOutTrigger) {
                return true;
            }
        }

        return false;
    }

    /**
     * Does this action manager has pick triggers
     */
    public get hasPickTriggers(): boolean {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];

            if (action.trigger >= ActionManager.OnPickTrigger && action.trigger <= ActionManager.OnPickUpTrigger) {
                return true;
            }
        }

        return false;
    }

    /**
     * Registers an action to this action manager
     * @param action defines the action to be registered
     * @returns the action amended (prepared) after registration
     */
    public registerAction(action: IAction): Nullable<IAction> {
        if (action.trigger === ActionManager.OnEveryFrameTrigger) {
            if (this.getScene().actionManager !== this) {
                Logger.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                return null;
            }
        }

        this.actions.push(action);
        this.getScene()._registeredActions++;

        if (ActionManager.Triggers[action.trigger]) {
            ActionManager.Triggers[action.trigger]++;
        } else {
            ActionManager.Triggers[action.trigger] = 1;
        }

        action._actionManager = this;
        action._prepare();

        return action;
    }

    /**
     * Unregisters an action to this action manager
     * @param action defines the action to be unregistered
     * @returns a boolean indicating whether the action has been unregistered
     */
    public unregisterAction(action: IAction): Boolean {
        const index = this.actions.indexOf(action);
        if (index !== -1) {
            this.actions.splice(index, 1);
            ActionManager.Triggers[action.trigger] -= 1;
            if (ActionManager.Triggers[action.trigger] === 0) {
                delete ActionManager.Triggers[action.trigger];
            }
            action._actionManager = null;
            this.getScene()._registeredActions--;
            return true;
        }
        return false;
    }

    /**
     * Process a specific trigger
     * @param trigger defines the trigger to process
     * @param evt defines the event details to be processed
     */
    public processTrigger(trigger: number, evt?: IActionEvent): void {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];

            if (action.trigger === trigger) {
                if (evt) {
                    if (trigger === ActionManager.OnKeyUpTrigger || trigger === ActionManager.OnKeyDownTrigger) {
                        const parameter = action.getTriggerParameter();

                        if (parameter && parameter !== evt.sourceEvent.keyCode) {
                            if (!parameter.toLowerCase) {
                                continue;
                            }
                            const lowerCase = parameter.toLowerCase();

                            if (lowerCase !== evt.sourceEvent.key) {
                                const unicode = evt.sourceEvent.charCode ? evt.sourceEvent.charCode : evt.sourceEvent.keyCode;
                                const actualkey = String.fromCharCode(unicode).toLowerCase();
                                if (actualkey !== lowerCase) {
                                    continue;
                                }
                            }
                        }
                    }
                }

                action._executeCurrent(evt);
            }
        }
    }

    /**
     * @internal
     */
    public _getEffectiveTarget(target: any, propertyPath: string): any {
        const properties = propertyPath.split(".");

        for (let index = 0; index < properties.length - 1; index++) {
            target = target[properties[index]];
        }

        return target;
    }

    /**
     * @internal
     */
    public _getProperty(propertyPath: string): string {
        const properties = propertyPath.split(".");

        return properties[properties.length - 1];
    }

    /**
     * Serialize this manager to a JSON object
     * @param name defines the property name to store this manager
     * @returns a JSON representation of this manager
     */
    public serialize(name: string): any {
        const root = {
            children: new Array(),
            name: name,
            type: 3, // Root node
            properties: new Array(), // Empty for root but required
        };

        for (let i = 0; i < this.actions.length; i++) {
            const triggerObject = {
                type: 0, // Trigger
                children: new Array(),
                name: ActionManager.GetTriggerName(this.actions[i].trigger),
                properties: new Array(),
            };

            const triggerOptions = this.actions[i].triggerOptions;

            if (triggerOptions && typeof triggerOptions !== "number") {
                if (triggerOptions.parameter instanceof Node) {
                    triggerObject.properties.push(Action._GetTargetProperty(triggerOptions.parameter));
                } else {
                    const parameter = <any>{};
                    DeepCopier.DeepCopy(triggerOptions.parameter, parameter, ["mesh"]);

                    if (triggerOptions.parameter && triggerOptions.parameter.mesh) {
                        parameter._meshId = triggerOptions.parameter.mesh.id;
                    }

                    triggerObject.properties.push({ name: "parameter", targetType: null, value: parameter });
                }
            }

            // Serialize child action, recursively
            this.actions[i].serialize(triggerObject);

            // Add serialized trigger
            root.children.push(triggerObject);
        }

        return root;
    }

    /**
     * Creates a new ActionManager from a JSON data
     * @param parsedActions defines the JSON data to read from
     * @param object defines the hosting mesh
     * @param scene defines the hosting scene
     */
    public static Parse(parsedActions: any, object: Nullable<AbstractMesh>, scene: Scene): void {
        const actionManager = new ActionManager(scene);
        if (object === null) {
            scene.actionManager = actionManager;
        } else {
            object.actionManager = actionManager;
        }

        // instanciate a new object
        const instanciate = (name: string, params: Array<any>): any => {
            const internalClassType = GetClass("BABYLON." + name);
            if (internalClassType) {
                const newInstance: Object = Object.create(internalClassType.prototype);
                // eslint-disable-next-line prefer-spread
                newInstance.constructor.apply(newInstance, params);
                return newInstance;
            }
        };

        const parseParameter = (name: string, value: string, target: any, propertyPath: Nullable<string>): any => {
            if (propertyPath === null) {
                // String, boolean or float
                const floatValue = parseFloat(value);

                if (value === "true" || value === "false") {
                    return value === "true";
                } else {
                    return isNaN(floatValue) ? value : floatValue;
                }
            }

            const effectiveTarget = propertyPath.split(".");
            const values = value.split(",");

            // Get effective Target
            for (let i = 0; i < effectiveTarget.length; i++) {
                target = target[effectiveTarget[i]];
            }

            // Return appropriate value with its type
            if (typeof target === "boolean") {
                return values[0] === "true";
            }

            if (typeof target === "string") {
                return values[0];
            }

            // Parameters with multiple values such as Vector3 etc.
            const split = new Array<number>();
            for (let i = 0; i < values.length; i++) {
                split.push(parseFloat(values[i]));
            }

            if (target instanceof Vector3) {
                return Vector3.FromArray(split);
            }

            if (target instanceof Vector4) {
                return Vector4.FromArray(split);
            }

            if (target instanceof Color3) {
                return Color3.FromArray(split);
            }

            if (target instanceof Color4) {
                return Color4.FromArray(split);
            }

            return parseFloat(values[0]);
        };

        // traverse graph per trigger
        const traverse = (parsedAction: any, trigger: any, condition: Nullable<Condition>, action: Nullable<Action>, combineArray: Nullable<Array<Action>> = null) => {
            if (parsedAction.detached) {
                return;
            }

            const parameters = new Array<any>();
            let target: any = null;
            let propertyPath: Nullable<string> = null;
            const combine = parsedAction.combine && parsedAction.combine.length > 0;

            // Parameters
            if (parsedAction.type === 2) {
                parameters.push(actionManager);
            } else {
                parameters.push(trigger);
            }

            if (combine) {
                const actions = new Array<Action>();
                for (let j = 0; j < parsedAction.combine.length; j++) {
                    traverse(parsedAction.combine[j], ActionManager.NothingTrigger, condition, action, actions);
                }
                parameters.push(actions);
            } else {
                for (let i = 0; i < parsedAction.properties.length; i++) {
                    let value = parsedAction.properties[i].value;
                    const name = parsedAction.properties[i].name;
                    const targetType = parsedAction.properties[i].targetType;

                    if (name === "target") {
                        if (targetType !== null && targetType === "SceneProperties") {
                            value = target = scene;
                        } else {
                            value = target = scene.getNodeByName(value);
                        }
                    } else if (name === "parent") {
                        value = scene.getNodeByName(value);
                    } else if (name === "sound") {
                        // Can not externalize to component, so only checks for the presence off the API.
                        if (scene.getSoundByName) {
                            value = scene.getSoundByName(value);
                        }
                    } else if (name !== "propertyPath") {
                        if (parsedAction.type === 2 && name === "operator") {
                            value = (<any>ValueCondition)[value];
                        } else {
                            value = parseParameter(name, value, target, name === "value" ? propertyPath : null);
                        }
                    } else {
                        propertyPath = value;
                    }

                    parameters.push(value);
                }
            }

            if (combineArray === null) {
                parameters.push(condition);
            } else {
                parameters.push(null);
            }

            // If interpolate value action
            if (parsedAction.name === "InterpolateValueAction") {
                const param = parameters[parameters.length - 2];
                parameters[parameters.length - 1] = param;
                parameters[parameters.length - 2] = condition;
            }

            // Action or condition(s) and not CombineAction
            let newAction = instanciate(parsedAction.name, parameters);

            if (newAction instanceof Condition && condition !== null) {
                const nothing = new DoNothingAction(trigger, condition);

                if (action) {
                    action.then(nothing);
                } else {
                    actionManager.registerAction(nothing);
                }

                action = nothing;
            }

            if (combineArray === null) {
                if (newAction instanceof Condition) {
                    condition = newAction;
                    newAction = action;
                } else {
                    condition = null;
                    if (action) {
                        action.then(newAction);
                    } else {
                        actionManager.registerAction(newAction);
                    }
                }
            } else {
                combineArray.push(newAction);
            }

            for (let i = 0; i < parsedAction.children.length; i++) {
                traverse(parsedAction.children[i], trigger, condition, newAction, null);
            }
        };

        // triggers
        for (let i = 0; i < parsedActions.children.length; i++) {
            let triggerParams: any;
            const trigger = parsedActions.children[i];

            if (trigger.properties.length > 0) {
                const param = trigger.properties[0].value;
                const value = trigger.properties[0].targetType === null ? param : scene.getMeshByName(param);

                if (value._meshId) {
                    value.mesh = scene.getMeshById(value._meshId);
                }

                triggerParams = { trigger: (<any>ActionManager)[trigger.name], parameter: value };
            } else {
                triggerParams = (<any>ActionManager)[trigger.name];
            }

            for (let j = 0; j < trigger.children.length; j++) {
                if (!trigger.detached) {
                    traverse(trigger.children[j], triggerParams, null, null);
                }
            }
        }
    }

    /**
     * Get a trigger name by index
     * @param trigger defines the trigger index
     * @returns a trigger name
     */
    public static GetTriggerName(trigger: number): string {
        switch (trigger) {
            case 0:
                return "NothingTrigger";
            case 1:
                return "OnPickTrigger";
            case 2:
                return "OnLeftPickTrigger";
            case 3:
                return "OnRightPickTrigger";
            case 4:
                return "OnCenterPickTrigger";
            case 5:
                return "OnPickDownTrigger";
            case 6:
                return "OnPickUpTrigger";
            case 7:
                return "OnLongPressTrigger";
            case 8:
                return "OnPointerOverTrigger";
            case 9:
                return "OnPointerOutTrigger";
            case 10:
                return "OnEveryFrameTrigger";
            case 11:
                return "OnIntersectionEnterTrigger";
            case 12:
                return "OnIntersectionExitTrigger";
            case 13:
                return "OnKeyDownTrigger";
            case 14:
                return "OnKeyUpTrigger";
            case 15:
                return "OnPickOutTrigger";
            default:
                return "";
        }
    }
}
