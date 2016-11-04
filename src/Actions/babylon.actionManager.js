var BABYLON;
(function (BABYLON) {
    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    var ActionEvent = (function () {
        /**
         * @constructor
         * @param source The mesh or sprite that triggered the action.
         * @param pointerX The X mouse cursor position at the time of the event
         * @param pointerY The Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        function ActionEvent(source, pointerX, pointerY, meshUnderPointer, sourceEvent, additionalData) {
            this.source = source;
            this.pointerX = pointerX;
            this.pointerY = pointerY;
            this.meshUnderPointer = meshUnderPointer;
            this.sourceEvent = sourceEvent;
            this.additionalData = additionalData;
        }
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNew = function (source, evt, additionalData) {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        };
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source sprite that triggered the event
         * @param scene Scene associated with the sprite
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNewFromSprite = function (source, scene, evt, additionalData) {
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        };
        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNewFromScene = function (scene, evt) {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        };
        ActionEvent.CreateNewFromPrimitive = function (prim, pointerPos, evt, additionalData) {
            return new ActionEvent(prim, pointerPos.x, pointerPos.y, null, evt, additionalData);
        };
        return ActionEvent;
    }());
    BABYLON.ActionEvent = ActionEvent;
    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
    var ActionManager = (function () {
        function ActionManager(scene) {
            // Members
            this.actions = new Array();
            this.hoverCursor = '';
            this._scene = scene;
            scene._actionManagers.push(this);
        }
        Object.defineProperty(ActionManager, "NothingTrigger", {
            get: function () {
                return ActionManager._NothingTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickTrigger", {
            get: function () {
                return ActionManager._OnPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnLeftPickTrigger", {
            get: function () {
                return ActionManager._OnLeftPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnRightPickTrigger", {
            get: function () {
                return ActionManager._OnRightPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnCenterPickTrigger", {
            get: function () {
                return ActionManager._OnCenterPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickDownTrigger", {
            get: function () {
                return ActionManager._OnPickDownTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickUpTrigger", {
            get: function () {
                return ActionManager._OnPickUpTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickOutTrigger", {
            /// This trigger will only be raised if you also declared a OnPickDown
            get: function () {
                return ActionManager._OnPickOutTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnLongPressTrigger", {
            get: function () {
                return ActionManager._OnLongPressTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPointerOverTrigger", {
            get: function () {
                return ActionManager._OnPointerOverTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPointerOutTrigger", {
            get: function () {
                return ActionManager._OnPointerOutTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnEveryFrameTrigger", {
            get: function () {
                return ActionManager._OnEveryFrameTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnIntersectionEnterTrigger", {
            get: function () {
                return ActionManager._OnIntersectionEnterTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnIntersectionExitTrigger", {
            get: function () {
                return ActionManager._OnIntersectionExitTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnKeyDownTrigger", {
            get: function () {
                return ActionManager._OnKeyDownTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnKeyUpTrigger", {
            get: function () {
                return ActionManager._OnKeyUpTrigger;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        ActionManager.prototype.dispose = function () {
            var index = this._scene._actionManagers.indexOf(this);
            if (index > -1) {
                this._scene._actionManagers.splice(index, 1);
            }
        };
        ActionManager.prototype.getScene = function () {
            return this._scene;
        };
        /**
         * Does this action manager handles actions of any of the given triggers
         * @param {number[]} triggers - the triggers to be tested
         * @return {boolean} whether one (or more) of the triggers is handeled
         */
        ActionManager.prototype.hasSpecificTriggers = function (triggers) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];
                if (triggers.indexOf(action.trigger) > -1) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Does this action manager handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled
         */
        ActionManager.prototype.hasSpecificTrigger = function (trigger) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];
                if (action.trigger === trigger) {
                    return true;
                }
            }
            return false;
        };
        Object.defineProperty(ActionManager.prototype, "hasPointerTriggers", {
            /**
             * Does this action manager has pointer triggers
             * @return {boolean} whether or not it has pointer triggers
             */
            get: function () {
                for (var index = 0; index < this.actions.length; index++) {
                    var action = this.actions[index];
                    if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPointerOutTrigger) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager.prototype, "hasPickTriggers", {
            /**
             * Does this action manager has pick triggers
             * @return {boolean} whether or not it has pick triggers
             */
            get: function () {
                for (var index = 0; index < this.actions.length; index++) {
                    var action = this.actions[index];
                    if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPickUpTrigger) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Registers an action to this action manager
         * @param {BABYLON.Action} action - the action to be registered
         * @return {BABYLON.Action} the action amended (prepared) after registration
         */
        ActionManager.prototype.registerAction = function (action) {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    BABYLON.Tools.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                    return null;
                }
            }
            this.actions.push(action);
            action._actionManager = this;
            action._prepare();
            return action;
        };
        /**
         * Process a specific trigger
         * @param {number} trigger - the trigger to process
         * @param evt {BABYLON.ActionEvent} the event details to be processed
         */
        ActionManager.prototype.processTrigger = function (trigger, evt) {
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
        };
        ActionManager.prototype._getEffectiveTarget = function (target, propertyPath) {
            var properties = propertyPath.split(".");
            for (var index = 0; index < properties.length - 1; index++) {
                target = target[properties[index]];
            }
            return target;
        };
        ActionManager.prototype._getProperty = function (propertyPath) {
            var properties = propertyPath.split(".");
            return properties[properties.length - 1];
        };
        ActionManager.prototype.serialize = function (name) {
            var root = {
                children: [],
                name: name,
                type: 3,
                properties: [] // Empty for root but required
            };
            for (var i = 0; i < this.actions.length; i++) {
                var triggerObject = {
                    type: 0,
                    children: [],
                    name: ActionManager.GetTriggerName(this.actions[i].trigger),
                    properties: []
                };
                var triggerOptions = this.actions[i].triggerOptions;
                if (triggerOptions && typeof triggerOptions !== "number") {
                    if (triggerOptions.parameter instanceof BABYLON.Node) {
                        triggerObject.properties.push(BABYLON.Action._GetTargetProperty(triggerOptions.parameter));
                    }
                    else {
                        triggerObject.properties.push({ name: "parameter", targetType: null, value: triggerOptions.parameter });
                    }
                }
                // Serialize child action, recursively
                this.actions[i].serialize(triggerObject);
                // Add serialized trigger
                root.children.push(triggerObject);
            }
            return root;
        };
        ActionManager.Parse = function (parsedActions, object, scene) {
            var actionManager = new BABYLON.ActionManager(scene);
            if (object === null)
                scene.actionManager = actionManager;
            else
                object.actionManager = actionManager;
            // instanciate a new object
            var instanciate = function (name, params) {
                var newInstance = Object.create(BABYLON[name].prototype);
                newInstance.constructor.apply(newInstance, params);
                return newInstance;
            };
            var parseParameter = function (name, value, target, propertyPath) {
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
                var split = new Array();
                for (var i = 0; i < values.length; i++)
                    split.push(parseFloat(values[i]));
                if (target instanceof BABYLON.Vector3)
                    return BABYLON.Vector3.FromArray(split);
                if (target instanceof BABYLON.Vector4)
                    return BABYLON.Vector4.FromArray(split);
                if (target instanceof BABYLON.Color3)
                    return BABYLON.Color3.FromArray(split);
                if (target instanceof BABYLON.Color4)
                    return BABYLON.Color4.FromArray(split);
                return parseFloat(values[0]);
            };
            // traverse graph per trigger
            var traverse = function (parsedAction, trigger, condition, action, combineArray) {
                if (combineArray === void 0) { combineArray = null; }
                if (parsedAction.detached)
                    return;
                var parameters = new Array();
                var target = null;
                var propertyPath = null;
                var combine = parsedAction.combine && parsedAction.combine.length > 0;
                // Parameters
                if (parsedAction.type === 2)
                    parameters.push(actionManager);
                else
                    parameters.push(trigger);
                if (combine) {
                    var actions = new Array();
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
                                value = BABYLON.ValueCondition[value];
                            else
                                value = parseParameter(name, value, target, name === "value" ? propertyPath : null);
                        }
                        else {
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
                if (newAction instanceof BABYLON.Condition && condition !== null) {
                    var nothing = new BABYLON.DoNothingAction(trigger, condition);
                    if (action)
                        action.then(nothing);
                    else
                        actionManager.registerAction(nothing);
                    action = nothing;
                }
                if (combineArray === null) {
                    if (newAction instanceof BABYLON.Condition) {
                        condition = newAction;
                        newAction = action;
                    }
                    else {
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
                var triggerParams;
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
        };
        ActionManager.GetTriggerName = function (trigger) {
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
        };
        // Statics
        ActionManager._NothingTrigger = 0;
        ActionManager._OnPickTrigger = 1;
        ActionManager._OnLeftPickTrigger = 2;
        ActionManager._OnRightPickTrigger = 3;
        ActionManager._OnCenterPickTrigger = 4;
        ActionManager._OnPickDownTrigger = 5;
        ActionManager._OnPickUpTrigger = 6;
        ActionManager._OnLongPressTrigger = 7;
        ActionManager._OnPointerOverTrigger = 8;
        ActionManager._OnPointerOutTrigger = 9;
        ActionManager._OnEveryFrameTrigger = 10;
        ActionManager._OnIntersectionEnterTrigger = 11;
        ActionManager._OnIntersectionExitTrigger = 12;
        ActionManager._OnKeyDownTrigger = 13;
        ActionManager._OnKeyUpTrigger = 14;
        ActionManager._OnPickOutTrigger = 15;
        ActionManager.DragMovementThreshold = 10; // in pixels
        ActionManager.LongPressDelay = 500; // in milliseconds
        return ActionManager;
    }());
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));
