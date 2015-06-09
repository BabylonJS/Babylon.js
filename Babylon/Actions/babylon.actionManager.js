var BABYLON;
(function (BABYLON) {
    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    var ActionEvent = (function () {
        /**
         * @constructor
         * @param source The mesh that triggered the action.
         * @param pointerX the X mouse cursor position at the time of the event
         * @param pointerY the Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        function ActionEvent(source, pointerX, pointerY, meshUnderPointer, sourceEvent) {
            this.source = source;
            this.pointerX = pointerX;
            this.pointerY = pointerY;
            this.meshUnderPointer = meshUnderPointer;
            this.sourceEvent = sourceEvent;
        }
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source the source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNew = function (source, evt) {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        };
        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNewFromScene = function (scene, evt) {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        };
        return ActionEvent;
    })();
    BABYLON.ActionEvent = ActionEvent;
    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
    var ActionManager = (function () {
        function ActionManager(scene) {
            // Members
            this.actions = new Array();
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
        Object.defineProperty(ActionManager, "OnPickUpTrigger", {
            get: function () {
                return ActionManager._OnPickUpTrigger;
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
                    if (action.trigger == ActionManager._OnPickUpTrigger) {
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
                    if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnCenterPickTrigger) {
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
        // Statics
        ActionManager._NothingTrigger = 0;
        ActionManager._OnPickTrigger = 1;
        ActionManager._OnLeftPickTrigger = 2;
        ActionManager._OnRightPickTrigger = 3;
        ActionManager._OnCenterPickTrigger = 4;
        ActionManager._OnPointerOverTrigger = 5;
        ActionManager._OnPointerOutTrigger = 6;
        ActionManager._OnEveryFrameTrigger = 7;
        ActionManager._OnIntersectionEnterTrigger = 8;
        ActionManager._OnIntersectionExitTrigger = 9;
        ActionManager._OnKeyDownTrigger = 10;
        ActionManager._OnKeyUpTrigger = 11;
        ActionManager._OnPickUpTrigger = 12;
        return ActionManager;
    })();
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.actionManager.js.map