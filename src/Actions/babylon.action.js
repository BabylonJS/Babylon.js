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
        return Action;
    })();
    BABYLON.Action = Action;
})(BABYLON || (BABYLON = {}));
