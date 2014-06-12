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

        Action.prototype._executeCurrent = function (evt) {
            if (this._condition) {
                var currentRenderId = this._actionManager.getScene().getRenderId();

                // We cache the current evaluation for the current frame
                if (this._condition._evaluationId === currentRenderId) {
                    if (!this._condition._currentResult) {
                        return;
                    }
                } else {
                    this._condition._evaluationId = currentRenderId;

                    if (!this._condition.isValid()) {
                        this._condition._currentResult = false;
                        return;
                    }

                    this._condition._currentResult = true;
                }
            }

            this._nextActiveAction.execute(evt);

            if (this._nextActiveAction._child) {
                this._nextActiveAction = this._nextActiveAction._child;
            } else {
                this._nextActiveAction = this;
            }
        };

        Action.prototype.execute = function (evt) {
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
//# sourceMappingURL=babylon.action.js.map
