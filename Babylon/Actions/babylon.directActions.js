var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var SwitchBooleanAction = (function (_super) {
        __extends(SwitchBooleanAction, _super);
        function SwitchBooleanAction(trigger, targetType, targetName, propertyPath, condition) {
            _super.call(this, trigger, condition);
            this.targetType = targetType;
            this.targetName = targetName;
            this.propertyPath = propertyPath;
        }
        SwitchBooleanAction.prototype._prepare = function () {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };

        SwitchBooleanAction.prototype.execute = function () {
            this._target[this._property] = !this._target[this._property];
        };
        return SwitchBooleanAction;
    })(BABYLON.Action);
    BABYLON.SwitchBooleanAction = SwitchBooleanAction;

    var SetValueAction = (function (_super) {
        __extends(SetValueAction, _super);
        function SetValueAction(trigger, targetType, targetName, propertyPath, value, condition) {
            _super.call(this, trigger, condition);
            this.targetType = targetType;
            this.targetName = targetName;
            this.propertyPath = propertyPath;
            this.value = value;
        }
        SetValueAction.prototype._prepare = function () {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };

        SetValueAction.prototype.execute = function () {
            this._target[this._property] = this.value;
        };
        return SetValueAction;
    })(BABYLON.Action);
    BABYLON.SetValueAction = SetValueAction;

    var PlayAnimationAction = (function (_super) {
        __extends(PlayAnimationAction, _super);
        function PlayAnimationAction(trigger, targetType, targetName, from, to, loop, condition) {
            _super.call(this, trigger, condition);
            this.targetType = targetType;
            this.targetName = targetName;
            this.from = from;
            this.to = to;
            this.loop = loop;
        }
        PlayAnimationAction.prototype._prepare = function () {
            this._target = this._getTarget(this.targetType, this.targetName);
        };

        PlayAnimationAction.prototype.execute = function () {
            var scene = this._actionManager.getScene();
            scene.beginAnimation(this._target, this.from, this.to, this.loop);
        };
        return PlayAnimationAction;
    })(BABYLON.Action);
    BABYLON.PlayAnimationAction = PlayAnimationAction;

    var StopAnimationAction = (function (_super) {
        __extends(StopAnimationAction, _super);
        function StopAnimationAction(trigger, targetType, targetName, condition) {
            _super.call(this, trigger, condition);
            this.targetType = targetType;
            this.targetName = targetName;
        }
        StopAnimationAction.prototype._prepare = function () {
            this._target = this._getTarget(this.targetType, this.targetName);
        };

        StopAnimationAction.prototype.execute = function () {
            var scene = this._actionManager.getScene();
            scene.stopAnimation(this._target);
        };
        return StopAnimationAction;
    })(BABYLON.Action);
    BABYLON.StopAnimationAction = StopAnimationAction;

    var ExecuteCodeAction = (function (_super) {
        __extends(ExecuteCodeAction, _super);
        function ExecuteCodeAction(trigger, func, condition) {
            _super.call(this, trigger, condition);
            this.func = func;
        }
        ExecuteCodeAction.prototype.execute = function () {
            this.func();
        };
        return ExecuteCodeAction;
    })(BABYLON.Action);
    BABYLON.ExecuteCodeAction = ExecuteCodeAction;

    var SetParentAction = (function (_super) {
        __extends(SetParentAction, _super);
        function SetParentAction(trigger, targetType, targetName, parentType, parentName, condition) {
            _super.call(this, trigger, condition);
            this.targetType = targetType;
            this.targetName = targetName;
            this.parentType = parentType;
            this.parentName = parentName;
        }
        SetParentAction.prototype._prepare = function () {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._parent = this._getTarget(this.parentType, this.parentName);
        };

        SetParentAction.prototype.execute = function () {
            if (this._target.parent === this._parent) {
                return;
            }

            var invertParentWorldMatrix = this._parent.getWorldMatrix().clone();
            invertParentWorldMatrix.invert();

            this._target.position = BABYLON.Vector3.TransformCoordinates(this._target.position, invertParentWorldMatrix);

            this._target.parent = this._parent;
        };
        return SetParentAction;
    })(BABYLON.Action);
    BABYLON.SetParentAction = SetParentAction;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.directActions.js.map
