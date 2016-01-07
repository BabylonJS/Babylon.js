module BABYLON {

    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    export class ActionEvent {
        /**
         * @constructor
         * @param source The mesh or sprite that triggered the action.
         * @param pointerX The X mouse cursor position at the time of the event
         * @param pointerY The Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        constructor(public source: any, public pointerX: number, public pointerY: number, public meshUnderPointer: AbstractMesh, public sourceEvent?: any, public additionalData?: any) {

        }

        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        public static CreateNew(source: AbstractMesh, evt?: Event, additionalData?: any): ActionEvent {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        }

        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source sprite that triggered the event
         * @param scene Scene associated with the sprite
         * @param evt {Event} The original (browser) event
         */
        public static CreateNewFromSprite(source: Sprite, scene: Scene, evt?: Event, additionalData?: any): ActionEvent {
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        }

        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        public static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        }
    }

    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
    export class ActionManager {
        // Statics
        private static _NothingTrigger = 0;
        private static _OnPickTrigger = 1;
        private static _OnLeftPickTrigger = 2;
        private static _OnRightPickTrigger = 3;
        private static _OnCenterPickTrigger = 4;
        private static _OnPickDownTrigger = 5;
        private static _OnPickUpTrigger = 6;
        private static _OnLongPressTrigger = 7;
        private static _OnPointerOverTrigger = 8;
        private static _OnPointerOutTrigger = 9;
        private static _OnEveryFrameTrigger = 10;
        private static _OnIntersectionEnterTrigger = 11;
        private static _OnIntersectionExitTrigger = 12;
        private static _OnKeyDownTrigger = 13;
        private static _OnKeyUpTrigger = 14;

        public static get NothingTrigger(): number {
            return ActionManager._NothingTrigger;
        }

        public static get OnPickTrigger(): number {
            return ActionManager._OnPickTrigger;
        }

        public static get OnLeftPickTrigger(): number {
            return ActionManager._OnLeftPickTrigger;
        }

        public static get OnRightPickTrigger(): number {
            return ActionManager._OnRightPickTrigger;
        }

        public static get OnCenterPickTrigger(): number {
            return ActionManager._OnCenterPickTrigger;
        }

        public static get OnPickDownTrigger(): number {
            return ActionManager._OnPickDownTrigger;
        }

        public static get OnPickUpTrigger(): number {
            return ActionManager._OnPickUpTrigger;
        }

        public static get OnLongPressTrigger(): number {
            return ActionManager._OnLongPressTrigger;
        }
        
        public static get OnPointerOverTrigger(): number {
            return ActionManager._OnPointerOverTrigger;
        }

        public static get OnPointerOutTrigger(): number {
            return ActionManager._OnPointerOutTrigger;
        }

        public static get OnEveryFrameTrigger(): number {
            return ActionManager._OnEveryFrameTrigger;
        }

        public static get OnIntersectionEnterTrigger(): number {
            return ActionManager._OnIntersectionEnterTrigger;
        }

        public static get OnIntersectionExitTrigger(): number {
            return ActionManager._OnIntersectionExitTrigger;
        }

        public static get OnKeyDownTrigger(): number {
            return ActionManager._OnKeyDownTrigger;
        }

        public static get OnKeyUpTrigger(): number {
            return ActionManager._OnKeyUpTrigger;
        }
        
        public static DragMovementThreshold = 10; // in pixels
        public static LongPressDelay = 500; // in milliseconds
        
        // Members
        public actions = new Array<Action>();

        private _scene: Scene;

        constructor(scene: Scene) {
            this._scene = scene;

            scene._actionManagers.push(this);
        }

        // Methods
        public dispose(): void {
            var index = this._scene._actionManagers.indexOf(this);

            if (index > -1) {
                this._scene._actionManagers.splice(index, 1);
            }
        }

        public getScene(): Scene {
            return this._scene;
        }

        /**
         * Does this action manager handles actions of any of the given triggers
         * @param {number[]} triggers - the triggers to be tested
         * @return {boolean} whether one (or more) of the triggers is handeled 
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
         * Does this action manager handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled 
         */
        public hasSpecificTrigger(trigger: number): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Does this action manager has pointer triggers
         * @return {boolean} whether or not it has pointer triggers
         */
        public get hasPointerTriggers(): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPointerOutTrigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Does this action manager has pick triggers
         * @return {boolean} whether or not it has pick triggers
         */
        public get hasPickTriggers(): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPickUpTrigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Registers an action to this action manager
         * @param {BABYLON.Action} action - the action to be registered
         * @return {BABYLON.Action} the action amended (prepared) after registration
         */
        public registerAction(action: Action): Action {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    Tools.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                    return null;
                }
            }

            this.actions.push(action);

            action._actionManager = this;
            action._prepare();

            return action;
        }

        /**
         * Process a specific trigger
         * @param {number} trigger - the trigger to process
         * @param evt {BABYLON.ActionEvent} the event details to be processed
         */
        public processTrigger(trigger: number, evt: ActionEvent): void {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    if (trigger === ActionManager.OnKeyUpTrigger
                        || trigger === ActionManager.OnKeyDownTrigger) {
                        var parameter = action.getTriggerParameter();

                        if (parameter) {
                            var unicode = evt.sourceEvent.charCode ? evt.sourceEvent.charCode : evt.sourceEvent.keyCode;
                            var actualkey = String.fromCharCode(unicode).toLowerCase();
                            if (actualkey !== parameter.toLowerCase()) {
                                continue;
                            }
                        }
                    }

                    action._executeCurrent(evt);
                }
            }
        }

        public _getEffectiveTarget(target: any, propertyPath: string): any {
            var properties = propertyPath.split(".");

            for (var index = 0; index < properties.length - 1; index++) {
                target = target[properties[index]];
            }

            return target;
        }

        public _getProperty(propertyPath: string): string {
            var properties = propertyPath.split(".");

            return properties[properties.length - 1];
        }

        public static Parse(parsedActions: any, object: AbstractMesh, scene: Scene) {
            var actionManager = new BABYLON.ActionManager(scene);
            if (object === null)
                scene.actionManager = actionManager;
            else
                object.actionManager = actionManager;

            // instanciate a new object
            var instanciate = (name: any, params: Array<any>): any => {
                var newInstance: Object = Object.create(BABYLON[name].prototype);
                newInstance.constructor.apply(newInstance, params);
                return newInstance;
            };

            var parseParameter = (name: string, value: string, target: any, propertyPath: string): any => {
                if (propertyPath === null) {
                    // String, boolean or float
                    var floatValue = parseFloat(value);

                    if (value === "true" || value === "false")
                        return value === "true";
                    else
                        return isNaN(floatValue) ? value : floatValue;
                }

                var effectiveTarget = propertyPath.split(".");
                var values = value.split(",");

                // Get effective Target
                for (var i = 0; i < effectiveTarget.length; i++) {
                    target = target[effectiveTarget[i]];
                }

                // Return appropriate value with its type
                if (typeof (target) === "boolean")
                    return values[0] === "true";

                if (typeof (target) === "string")
                    return values[0];

                // Parameters with multiple values such as Vector3 etc.
                var split = new Array<number>();
                for (var i = 0; i < values.length; i++)
                    split.push(parseFloat(values[i]));

                if (target instanceof Vector3)
                    return Vector3.FromArray(split);

                if (target instanceof Vector4)
                    return Vector4.FromArray(split);

                if (target instanceof Color3)
                    return Color3.FromArray(split);

                if (target instanceof Color4)
                    return Color4.FromArray(split);

                return parseFloat(values[0]);
            };

            // traverse graph per trigger
            var traverse = (parsedAction: any, trigger: any, condition: Condition, action: Action, combineArray: Array<Action> = null) => {
                if (parsedAction.detached)
                    return;

                var parameters = new Array<any>();
                var target: any = null;
                var propertyPath: string = null;
                var combine = parsedAction.combine && parsedAction.combine.length > 0;

                // Parameters
                if (parsedAction.type === 2)
                    parameters.push(actionManager);
                else
                    parameters.push(trigger);

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

                        if (name === "target")
                            if (targetType !== null && targetType === "SceneProperties")
                                value = target = scene;
                            else
                                value = target = scene.getNodeByName(value);
                        else if (name === "parent")
                            value = scene.getNodeByName(value);
                        else if (name === "sound")
                            value = scene.getSoundByName(value);
                        else if (name !== "propertyPath") {
                            if (parsedAction.type === 2 && name === "operator")
                                value = ValueCondition[value];
                            else
                                value = parseParameter(name, value, target, name === "value" ? propertyPath : null);
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

                    if (action)
                        action.then(nothing);
                    else
                        actionManager.registerAction(nothing);

                    action = nothing;
                }

                if (combineArray === null) {
                    if (newAction instanceof Condition) {
                        condition = newAction;
                        newAction = action;
                    } else {
                        condition = null;
                        if (action)
                            action.then(newAction);
                        else
                            actionManager.registerAction(newAction);
                    }
                }
                else {
                    combineArray.push(newAction);
                }

                for (var i = 0; i < parsedAction.children.length; i++)
                    traverse(parsedAction.children[i], trigger, condition, newAction, null);
            };

            // triggers
            for (var i = 0; i < parsedActions.children.length; i++) {
                var triggerParams: any;
                var trigger = parsedActions.children[i];

                if (trigger.properties.length > 0) {
                    var param = trigger.properties[0].value;
                    var value = trigger.properties[0].targetType === null ? param : scene.getMeshByName(param);
                    triggerParams = { trigger: BABYLON.ActionManager[trigger.name], parameter: value };
                }
                else
                    triggerParams = BABYLON.ActionManager[trigger.name];

                for (var j = 0; j < trigger.children.length; j++) {
                    if (!trigger.detached)
                        traverse(trigger.children[j], triggerParams, null, null);
                }
            }
        }

    }
} 