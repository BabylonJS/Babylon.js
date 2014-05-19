var BABYLON;
(function (BABYLON) {
    var ActionManager = (function () {
        function ActionManager(scene) {
            // Members
            this.actions = new Array();
            this._scene = scene;
        }
        Object.defineProperty(ActionManager, "NoneTrigger", {
            get: function () {
                return ActionManager._NoneTrigger;
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

        // Methods
        ActionManager.prototype.getScene = function () {
            return this._scene;
        };

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

        ActionManager.prototype.processTrigger = function (trigger) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    action._executeCurrent();
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
        ActionManager._NoneTrigger = 0;
        ActionManager._OnPickTrigger = 1;
        ActionManager._OnPointerOverTrigger = 2;
        ActionManager._OnPointerOutTrigger = 3;
        ActionManager._OnEveryFrameTrigger = 4;
        return ActionManager;
    })();
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.actionManager.js.map
