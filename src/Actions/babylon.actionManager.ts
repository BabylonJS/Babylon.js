module BABYLON {

    /**
     * ActionEvent is the event being sent when an action is triggered.
     */
    export class ActionEvent {
        /**
         * Creates a new ActionEvent
         * @param source The mesh or sprite that triggered the action
         * @param pointerX The X mouse cursor position at the time of the event
         * @param pointerY The Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         * @param additionalData additional data for the event
         */
        constructor(
            /** The mesh or sprite that triggered the action */
            public source: any,
            /** The X mouse cursor position at the time of the event */
            public pointerX: number,
            /** The Y mouse cursor position at the time of the event */
            public pointerY: number,
            /** The mesh that is currently pointed at (can be null) */
            public meshUnderPointer: Nullable<AbstractMesh>,
            /** the original (browser) event that triggered the ActionEvent */
            public sourceEvent?: any,
            /** additional data for the event */
            public additionalData?: any) {

        }

        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source mesh that triggered the event
         * @param evt The original (browser) event
         * @param additionalData additional data for the event
         * @returns the new ActionEvent
         */
        public static CreateNew(source: AbstractMesh, evt?: Event, additionalData?: any): ActionEvent {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        }

        /**
         * Helper function to auto-create an ActionEvent from a source sprite
         * @param source The source sprite that triggered the event
         * @param scene Scene associated with the sprite
         * @param evt The original (browser) event
         * @param additionalData additional data for the event
         * @returns the new ActionEvent
         */
        public static CreateNewFromSprite(source: Sprite, scene: Scene, evt?: Event, additionalData?: any): ActionEvent {
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        }

        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt The original (browser) event
         * @returns the new ActionEvent
         */
        public static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        }

        /**
         * Helper function to auto-create an ActionEvent from a primitive
         * @param prim defines the target primitive
         * @param pointerPos defines the pointer position
         * @param evt The original (browser) event
         * @param additionalData additional data for the event
         * @returns the new ActionEvent
         */
        public static CreateNewFromPrimitive(prim: any, pointerPos: Vector2, evt?: Event, additionalData?: any): ActionEvent {
            return new ActionEvent(prim, pointerPos.x, pointerPos.y, null, evt, additionalData);
        }
    }

    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions
     */
    export class ActionManager {
        /**
         * Nothing
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly NothingTrigger = 0;

        /**
         * On pick
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnPickTrigger = 1;

        /**
         * On left pick
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnLeftPickTrigger  = 2;

        /**
         * On right pick
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnRightPickTrigger = 3;

        /**
         * On center pick
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnCenterPickTrigger = 4;

        /**
         * On pick down
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnPickDownTrigger = 5;

        /**
         * On double pick
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnDoublePickTrigger = 6;

        /**
         * On pick up
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnPickUpTrigger = 7;
        /**
         * On pick out.
         * This trigger will only be raised if you also declared a OnPickDown
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnPickOutTrigger = 16;

        /**
         * On long press
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnLongPressTrigger = 8;

        /**
         * On pointer over
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnPointerOverTrigger = 9;

        /**
         * On pointer out
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnPointerOutTrigger = 10;

        /**
         * On every frame
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnEveryFrameTrigger = 11;
        /**
         * On intersection enter
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnIntersectionEnterTrigger = 12;

        /**
         * On intersection exit
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnIntersectionExitTrigger = 13;

        /**
         * On key down
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnKeyDownTrigger = 14;

        /**
         * On key up
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
         */
        public static readonly OnKeyUpTrigger = 15;

        /** Gets the list of active triggers */
        public static Triggers: { [key: string]: number } = {};

        // Members
        /** Gets the list of actions */
        public actions = new Array<Action>();

        /** Gets the cursor to use when hovering items */
        public hoverCursor: string = '';

        private _scene: Scene;

        /**
         * Creates a new action manager
         * @param scene defines the hosting scene
         */
        constructor(scene: Scene) {
            this._scene = scene || Engine.LastCreatedScene;

            scene.actionManagers.push(this);
        }

        // Methods

        /**
         * Releases all associated resources
         */
        public dispose(): void {
            var index = this._scene.actionManagers.indexOf(this);

            for (var i = 0; i < this.actions.length; i++) {
                var action = this.actions[i];
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
         * @return a boolean indicating whether one (or more) of the triggers is handled
         */
        public hasSpecificTriggers(triggers: number[]): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

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
         * @return a boolean indicating whether one (or more) of the triggers is handled
         */
        public hasSpecificTriggers2(triggerA: number, triggerB: number): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

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
         * @return whether the trigger is handled
         */
        public hasSpecificTrigger(trigger: number, parameterPredicate?: (parameter: any) => boolean): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

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
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

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
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager.OnPickTrigger && action.trigger <= ActionManager.OnPickUpTrigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Does exist one action manager with at least one trigger
         **/
        public static get HasTriggers(): boolean {
            for (var t in ActionManager.Triggers) {
                if (ActionManager.Triggers.hasOwnProperty(t)) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Does exist one action manager with at least one pick trigger
         **/
        public static get HasPickTriggers(): boolean {
            for (var t in ActionManager.Triggers) {
                if (ActionManager.Triggers.hasOwnProperty(t)) {
                    let t_int = parseInt(t);
                    if (t_int >= ActionManager.OnPickTrigger && t_int <= ActionManager.OnPickUpTrigger) {
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Does exist one action manager that handles actions of a given trigger
         * @param trigger defines the trigger to be tested
         * @return a boolean indicating whether the trigger is handeled by at least one action manager
        **/
        public static HasSpecificTrigger(trigger: number): boolean {
            for (var t in ActionManager.Triggers) {
                if (ActionManager.Triggers.hasOwnProperty(t)) {
                    let t_int = parseInt(t);
                    if (t_int === trigger) {
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Registers an action to this action manager
         * @param action defines the action to be registered
         * @return the action amended (prepared) after registration
         */
        public registerAction(action: Action): Nullable<Action> {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    Tools.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                    return null;
                }
            }

            this.actions.push(action);

            if (ActionManager.Triggers[action.trigger]) {
                ActionManager.Triggers[action.trigger]++;
            }
            else {
                ActionManager.Triggers[action.trigger] = 1;
            }

            action._actionManager = this;
            action._prepare();

            return action;
        }

        /**
         * Unregisters an action to this action manager
         * @param action defines the action to be unregistered
         * @return a boolean indicating whether the action has been unregistered
         */
        public unregisterAction(action: Action): Boolean {
            var index = this.actions.indexOf(action);
            if (index !== -1) {
                this.actions.splice(index, 1);
                ActionManager.Triggers[action.trigger] -= 1;
                if (ActionManager.Triggers[action.trigger] === 0) {
                    delete ActionManager.Triggers[action.trigger];
                }
                delete action._actionManager;
                return true;
            }
            return false;
        }

        /**
         * Process a specific trigger
         * @param trigger defines the trigger to process
         * @param evt defines the event details to be processed
         */
        public processTrigger(trigger: number, evt?: ActionEvent): void {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    if (evt) {
                        if (trigger === ActionManager.OnKeyUpTrigger
                            || trigger === ActionManager.OnKeyDownTrigger) {
                            var parameter = action.getTriggerParameter();

                            if (parameter && parameter !== evt.sourceEvent.keyCode) {
                                if (!parameter.toLowerCase) {
                                    continue;
                                }
                                var lowerCase = parameter.toLowerCase();

                                if (lowerCase !== evt.sourceEvent.key) {
                                    var unicode = evt.sourceEvent.charCode ? evt.sourceEvent.charCode : evt.sourceEvent.keyCode;
                                    var actualkey = String.fromCharCode(unicode).toLowerCase();
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

        /** @hidden */
        public _getEffectiveTarget(target: any, propertyPath: string): any {
            var properties = propertyPath.split(".");

            for (var index = 0; index < properties.length - 1; index++) {
                target = target[properties[index]];
            }

            return target;
        }

        /** @hidden */
        public _getProperty(propertyPath: string): string {
            var properties = propertyPath.split(".");

            return properties[properties.length - 1];
        }

        /**
         * Serialize this manager to a JSON object
         * @param name defines the property name to store this manager
         * @returns a JSON representation of this manager
         */
        public serialize(name: string): any {
            var root = {
                children: new Array(),
                name: name,
                type: 3, // Root node
                properties: new Array() // Empty for root but required
            };

            for (var i = 0; i < this.actions.length; i++) {
                var triggerObject = {
                    type: 0, // Trigger
                    children: new Array(),
                    name: ActionManager.GetTriggerName(this.actions[i].trigger),
                    properties: new Array()
                };

                var triggerOptions = this.actions[i].triggerOptions;

                if (triggerOptions && typeof triggerOptions !== "number") {
                    if (triggerOptions.parameter instanceof Node) {
                        triggerObject.properties.push(Action._GetTargetProperty(triggerOptions.parameter));
                    }
                    else {
                        var parameter = <any>{};
                        Tools.DeepCopy(triggerOptions.parameter, parameter, ["mesh"]);

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
            var actionManager = new ActionManager(scene);
            if (object === null) {
                scene.actionManager = actionManager;
            }
            else {
                object.actionManager = actionManager;
            }

            // instanciate a new object
            var instanciate = (name: string, params: Array<any>): any => {
                // TODO: We will need to find a solution for the next line when using commonjs / es6 .
                var newInstance: Object = Object.create(Tools.Instantiate("BABYLON." + name).prototype);
                newInstance.constructor.apply(newInstance, params);
                return newInstance;
            };

            var parseParameter = (name: string, value: string, target: any, propertyPath: Nullable<string>): any => {
                if (propertyPath === null) {
                    // String, boolean or float
                    var floatValue = parseFloat(value);

                    if (value === "true" || value === "false") {
                        return value === "true";
                    }
                    else {
                        return isNaN(floatValue) ? value : floatValue;
                    }
                }

                var effectiveTarget = propertyPath.split(".");
                var values = value.split(",");

                // Get effective Target
                for (var i = 0; i < effectiveTarget.length; i++) {
                    target = target[effectiveTarget[i]];
                }

                // Return appropriate value with its type
                if (typeof (target) === "boolean") {
                    return values[0] === "true";
                }

                if (typeof (target) === "string") {
                    return values[0];
                }

                // Parameters with multiple values such as Vector3 etc.
                var split = new Array<number>();
                for (var i = 0; i < values.length; i++) {
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
            var traverse = (parsedAction: any, trigger: any, condition: Nullable<Condition>, action: Nullable<Action>, combineArray: Nullable<Array<Action>> = null) => {
                if (parsedAction.detached) {
                    return;
                }

                var parameters = new Array<any>();
                var target: any = null;
                var propertyPath: Nullable<string> = null;
                var combine = parsedAction.combine && parsedAction.combine.length > 0;

                // Parameters
                if (parsedAction.type === 2) {
                    parameters.push(actionManager);
                }
                else {
                    parameters.push(trigger);
                }

                if (combine) {
                    var actions = new Array<Action>();
                    for (var j = 0; j < parsedAction.combine.length; j++) {
                        traverse(parsedAction.combine[j], ActionManager.NothingTrigger, condition, action, actions);
                    }
                    parameters.push(actions);
                }
                else {
                    for (var i = 0; i < parsedAction.properties.length; i++) {
                        var value = parsedAction.properties[i].value;
                        var name = parsedAction.properties[i].name;
                        var targetType = parsedAction.properties[i].targetType;

                        if (name === "target") {
                            if (targetType !== null && targetType === "SceneProperties") {
                                value = target = scene;
                            }
                            else {
                                value = target = scene.getNodeByName(value);
                        }
                            }
                        else if (name === "parent") {
                            value = scene.getNodeByName(value);
                             }
                        else if (name === "sound") {
                            // Can not externalize to component, so only checks for the presence off the API.
                            if (scene.getSoundByName) {
                                value = scene.getSoundByName(value);
                            }
                        }
                        else if (name !== "propertyPath") {
                            if (parsedAction.type === 2 && name === "operator") {
                                value = (<any>ValueCondition)[value];
                            }
                            else {
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
                }
                else {
                    parameters.push(null);
                }

                // If interpolate value action
                if (parsedAction.name === "InterpolateValueAction") {
                    var param = parameters[parameters.length - 2];
                    parameters[parameters.length - 1] = param;
                    parameters[parameters.length - 2] = condition;
                }

                // Action or condition(s) and not CombineAction
                var newAction = instanciate(parsedAction.name, parameters);

                if (newAction instanceof Condition && condition !== null) {
                    var nothing = new DoNothingAction(trigger, condition);

                    if (action) {
                        action.then(nothing);
                    }
                    else {
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
                        }
                        else {
                            actionManager.registerAction(newAction);
                        }
                    }
                }
                else {
                    combineArray.push(newAction);
                }

                for (var i = 0; i < parsedAction.children.length; i++) {
                    traverse(parsedAction.children[i], trigger, condition, newAction, null);
                }
            };

            // triggers
            for (var i = 0; i < parsedActions.children.length; i++) {
                var triggerParams: any;
                var trigger = parsedActions.children[i];

                if (trigger.properties.length > 0) {
                    var param = trigger.properties[0].value;
                    var value = trigger.properties[0].targetType === null ? param : scene.getMeshByName(param);

                    if (value._meshId) {
                        value.mesh = scene.getMeshByID(value._meshId);
                    }

                    triggerParams = { trigger: (<any>ActionManager)[trigger.name], parameter: value };
                }
                else {
                    triggerParams = (<any>ActionManager)[trigger.name];
                }

                for (var j = 0; j < trigger.children.length; j++) {
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
                case 0: return "NothingTrigger";
                case 1: return "OnPickTrigger";
                case 2: return "OnLeftPickTrigger";
                case 3: return "OnRightPickTrigger";
                case 4: return "OnCenterPickTrigger";
                case 5: return "OnPickDownTrigger";
                case 6: return "OnPickUpTrigger";
                case 7: return "OnLongPressTrigger";
                case 8: return "OnPointerOverTrigger";
                case 9: return "OnPointerOutTrigger";
                case 10: return "OnEveryFrameTrigger";
                case 11: return "OnIntersectionEnterTrigger";
                case 12: return "OnIntersectionExitTrigger";
                case 13: return "OnKeyDownTrigger";
                case 14: return "OnKeyUpTrigger";
                case 15: return "OnPickOutTrigger";
                default: return "";
            }
        }
    }
}
