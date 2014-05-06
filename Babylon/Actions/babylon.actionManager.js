var BABYLON;
(function (BABYLON) {
    var ActionManager = (function () {
        function ActionManager(scene) {
            // Members
            this.actions = new Array();
            this._scene = scene;
        }
        // Methods
        ActionManager.prototype.getScene = function () {
            return this._scene;
        };

        ActionManager.prototype.registerAction = function (action) {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    console.warn("OnEveryFrameTrigger can only be used with scene.actionManager");
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
        ActionManager.NoneTrigger = 0;
        ActionManager.OnPickTrigger = 1;
        ActionManager.OnPointerOverTrigger = 2;
        ActionManager.OnPointerOutTrigger = 3;
        ActionManager.OnEveryFrameTrigger = 4;
        return ActionManager;
    })();
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.actionManager.js.map
