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

        ActionManager.prototype._getTarget = function (targetType, targetName) {
            var scene = this._scene;

            switch (targetType) {
                case ActionManager.SceneTarget:
                    return scene;
                case ActionManager.MeshTarget:
                    return scene.getMeshByName(targetName);
                case ActionManager.LightTarget:
                    return scene.getLightByName(targetName);
                case ActionManager.CameraTarget:
                    return scene.getCameraByName(targetName);
                case ActionManager.MaterialTarget:
                    return scene.getMaterialByName(targetName);
            }

            return null;
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
        ActionManager.AlwaysTrigger = 0;
        ActionManager.OnPickTrigger = 1;

        ActionManager.SceneTarget = 0;
        ActionManager.MeshTarget = 1;
        ActionManager.LightTarget = 2;
        ActionManager.CameraTarget = 3;
        ActionManager.MaterialTarget = 4;
        return ActionManager;
    })();
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.actionManager.js.map
