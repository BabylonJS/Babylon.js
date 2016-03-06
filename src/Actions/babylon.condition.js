var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var Condition = (function () {
        function Condition(actionManager) {
            this._actionManager = actionManager;
        }
        Condition.prototype.isValid = function () {
            return true;
        };
        Condition.prototype._getProperty = function (propertyPath) {
            return this._actionManager._getProperty(propertyPath);
        };
        Condition.prototype._getEffectiveTarget = function (target, propertyPath) {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        };
        return Condition;
    }());
    BABYLON.Condition = Condition;
    var ValueCondition = (function (_super) {
        __extends(ValueCondition, _super);
        function ValueCondition(actionManager, target, propertyPath, value, operator) {
            if (operator === void 0) { operator = ValueCondition.IsEqual; }
            _super.call(this, actionManager);
            this.propertyPath = propertyPath;
            this.value = value;
            this.operator = operator;
            this._target = this._getEffectiveTarget(target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }
        Object.defineProperty(ValueCondition, "IsEqual", {
            get: function () {
                return ValueCondition._IsEqual;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueCondition, "IsDifferent", {
            get: function () {
                return ValueCondition._IsDifferent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueCondition, "IsGreater", {
            get: function () {
                return ValueCondition._IsGreater;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueCondition, "IsLesser", {
            get: function () {
                return ValueCondition._IsLesser;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        ValueCondition.prototype.isValid = function () {
            switch (this.operator) {
                case ValueCondition.IsGreater:
                    return this._target[this._property] > this.value;
                case ValueCondition.IsLesser:
                    return this._target[this._property] < this.value;
                case ValueCondition.IsEqual:
                case ValueCondition.IsDifferent:
                    var check;
                    if (this.value.equals) {
                        check = this.value.equals(this._target[this._property]);
                    }
                    else {
                        check = this.value === this._target[this._property];
                    }
                    return this.operator === ValueCondition.IsEqual ? check : !check;
            }
            return false;
        };
        // Statics
        ValueCondition._IsEqual = 0;
        ValueCondition._IsDifferent = 1;
        ValueCondition._IsGreater = 2;
        ValueCondition._IsLesser = 3;
        return ValueCondition;
    }(Condition));
    BABYLON.ValueCondition = ValueCondition;
    var PredicateCondition = (function (_super) {
        __extends(PredicateCondition, _super);
        function PredicateCondition(actionManager, predicate) {
            _super.call(this, actionManager);
            this.predicate = predicate;
        }
        PredicateCondition.prototype.isValid = function () {
            return this.predicate();
        };
        return PredicateCondition;
    }(Condition));
    BABYLON.PredicateCondition = PredicateCondition;
    var StateCondition = (function (_super) {
        __extends(StateCondition, _super);
        function StateCondition(actionManager, target, value) {
            _super.call(this, actionManager);
            this.value = value;
            this._target = target;
        }
        // Methods
        StateCondition.prototype.isValid = function () {
            return this._target.state === this.value;
        };
        return StateCondition;
    }(Condition));
    BABYLON.StateCondition = StateCondition;
})(BABYLON || (BABYLON = {}));
