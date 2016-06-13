var BABYLON;
(function (BABYLON) {
    var Action = (function () {
        function Action(triggerOptions, condition) {
            this.triggerOptions = triggerOptions;
            if (triggerOptions.parameter) {
                this.trigger = triggerOptions.trigger;
                this._triggerParameter = triggerOptions.parameter;
            }
            else {
                this.trigger = triggerOptions;
            }
            this._nextActiveAction = this;
            this._condition = condition;
        }
        // Methods
        Action.prototype._prepare = function () {
        };
        Action.prototype.getTriggerParameter = function () {
            return this._triggerParameter;
        };
        Action.prototype._executeCurrent = function (evt) {
            if (this._nextActiveAction._condition) {
                var condition = this._nextActiveAction._condition;
                var currentRenderId = this._actionManager.getScene().getRenderId();
                // We cache the current evaluation for the current frame
                if (condition._evaluationId === currentRenderId) {
                    if (!condition._currentResult) {
                        return;
                    }
                }
                else {
                    condition._evaluationId = currentRenderId;
                    if (!condition.isValid()) {
                        condition._currentResult = false;
                        return;
                    }
                    condition._currentResult = true;
                }
            }
            this._nextActiveAction.execute(evt);
            this.skipToNextActiveAction();
        };
        Action.prototype.execute = function (evt) {
        };
        Action.prototype.skipToNextActiveAction = function () {
            if (this._nextActiveAction._child) {
                if (!this._nextActiveAction._child._actionManager) {
                    this._nextActiveAction._child._actionManager = this._actionManager;
                }
                this._nextActiveAction = this._nextActiveAction._child;
            }
            else {
                this._nextActiveAction = this;
            }
        };
        Action.prototype.then = function (action) {
            this._child = action;
            action._actionManager = this._actionManager;
            action._prepare();
            return action;
        };
        Action.prototype._getProperty = function (propertyPath) {
            return this._actionManager._getProperty(propertyPath);
        };
        Action.prototype._getEffectiveTarget = function (target, propertyPath) {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        };
        Action.prototype.serialize = function (parent) {
        };
        // Called by BABYLON.Action objects in serialize(...). Internal use
        Action.prototype._serialize = function (serializedAction, parent) {
            var serializationObject = {
                type: 1,
                children: [],
                name: serializedAction.name,
                properties: serializedAction.properties || []
            };
            // Serialize child
            if (this._child) {
                this._child.serialize(serializationObject);
            }
            // Check if "this" has a condition
            if (this._condition) {
                var serializedCondition = this._condition.serialize();
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
        };
        Action._SerializeValueAsString = function (value) {
            if (typeof value === "number") {
                return value.toString();
            }
            if (typeof value === "boolean") {
                return value ? "true" : "false";
            }
            if (value instanceof BABYLON.Vector2) {
                return value.x + ", " + value.y;
            }
            if (value instanceof BABYLON.Vector3) {
                return value.x + ", " + value.y + ", " + value.z;
            }
            if (value instanceof BABYLON.Color3) {
                return value.r + ", " + value.g + ", " + value.b;
            }
            if (value instanceof BABYLON.Color4) {
                return value.r + ", " + value.g + ", " + value.b + ", " + value.a;
            }
            return value; // string
        };
        Action._GetTargetProperty = function (target) {
            return {
                name: "target",
                targetType: target instanceof BABYLON.Mesh ? "MeshProperties"
                    : target instanceof BABYLON.Light ? "LightProperties"
                        : target instanceof BABYLON.Camera ? "CameraProperties"
                            : "SceneProperties",
                value: target instanceof BABYLON.Scene ? "Scene" : target.name
            };
        };
        return Action;
    }());
    BABYLON.Action = Action;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.action.js.map