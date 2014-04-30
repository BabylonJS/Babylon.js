var BABYLON;
(function (BABYLON) {
    var Action = (function () {
        function Action(trigger, condition) {
            this.trigger = trigger;
            this._nextActiveAction = this;
            this._condition = condition;
        }
        // Methods
        Action.prototype._prepare = function () {
        };

        Action.prototype._executeCurrent = function () {
            if (this._condition) {
                if (!this._condition.isValid()) {
                    return;
                }
            }

            this._nextActiveAction.execute();

            if (this._nextActiveAction._child) {
                this._nextActiveAction = this._nextActiveAction._child;
            } else {
                this._nextActiveAction = this;
            }
        };

        Action.prototype.execute = function () {
        };

        Action.prototype.then = function (action) {
            this._child = action;

            action._actionManager = this._actionManager;
            action._prepare();

            return action;
        };

        Action.prototype._getTarget = function (targetType, targetName) {
            return this._actionManager._getTarget(targetType, targetName);
        };

        Action.prototype._getProperty = function (propertyPath) {
            return this._actionManager._getProperty(propertyPath);
        };

        Action.prototype._getEffectiveTarget = function (target, propertyPath) {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        };
        return Action;
    })();
    BABYLON.Action = Action;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.action.js.map
