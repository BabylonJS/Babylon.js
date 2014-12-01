var BABYLON;
(function (BABYLON) {
    var ActionEvent = (function () {
        function ActionEvent(source, pointerX, pointerY, meshUnderPointer, sourceEvent) {
            this.source = source;
            this.pointerX = pointerX;
            this.pointerY = pointerY;
            this.meshUnderPointer = meshUnderPointer;
            this.sourceEvent = sourceEvent;
        }
        ActionEvent.CreateNew = function (source) {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer);
        };

        ActionEvent.CreateNewFromScene = function (scene, evt) {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        };
        return ActionEvent;
    })();
    BABYLON.ActionEvent = ActionEvent;

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

        ActionManager.prototype.hasSpecificTriggers = function (triggers) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (triggers.indexOf(action.trigger) > -1) {
                    return true;
                }
            }

            return false;
        };

        Object.defineProperty(ActionManager.prototype, "hasPointerTriggers", {
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

        ActionManager.prototype.processTrigger = function (trigger, evt) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    if (trigger == ActionManager.OnKeyUpTrigger || trigger == ActionManager.OnKeyDownTrigger) {
                        var parameter = action.getTriggerParameter();

                        if (parameter) {
                            if (evt.sourceEvent.key !== parameter) {
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
        return ActionManager;
    })();
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.actionManager.js.map
