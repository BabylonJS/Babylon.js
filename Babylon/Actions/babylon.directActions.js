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
        function SwitchBooleanAction(triggerOptions, target, propertyPath, condition) {
            _super.call(this, triggerOptions, condition);
            this.propertyPath = propertyPath;
            this._target = target;
        }
        SwitchBooleanAction.prototype._prepare = function () {
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };
        SwitchBooleanAction.prototype.execute = function () {
            this._target[this._property] = !this._target[this._property];
        };
        return SwitchBooleanAction;
    })(BABYLON.Action);
    BABYLON.SwitchBooleanAction = SwitchBooleanAction;
    var SetStateAction = (function (_super) {
        __extends(SetStateAction, _super);
        function SetStateAction(triggerOptions, target, value, condition) {
            _super.call(this, triggerOptions, condition);
            this.value = value;
            this._target = target;
        }
        SetStateAction.prototype.execute = function () {
            this._target.state = this.value;
        };
        return SetStateAction;
    })(BABYLON.Action);
    BABYLON.SetStateAction = SetStateAction;
    var SetValueAction = (function (_super) {
        __extends(SetValueAction, _super);
        function SetValueAction(triggerOptions, target, propertyPath, value, condition) {
            _super.call(this, triggerOptions, condition);
            this.propertyPath = propertyPath;
            this.value = value;
            this._target = target;
        }
        SetValueAction.prototype._prepare = function () {
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };
        SetValueAction.prototype.execute = function () {
            this._target[this._property] = this.value;
        };
        return SetValueAction;
    })(BABYLON.Action);
    BABYLON.SetValueAction = SetValueAction;
    var IncrementValueAction = (function (_super) {
        __extends(IncrementValueAction, _super);
        function IncrementValueAction(triggerOptions, target, propertyPath, value, condition) {
            _super.call(this, triggerOptions, condition);
            this.propertyPath = propertyPath;
            this.value = value;
            this._target = target;
        }
        IncrementValueAction.prototype._prepare = function () {
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
            if (typeof this._target[this._property] !== "number") {
                BABYLON.Tools.Warn("Warning: IncrementValueAction can only be used with number values");
            }
        };
        IncrementValueAction.prototype.execute = function () {
            this._target[this._property] += this.value;
        };
        return IncrementValueAction;
    })(BABYLON.Action);
    BABYLON.IncrementValueAction = IncrementValueAction;
    var PlayAnimationAction = (function (_super) {
        __extends(PlayAnimationAction, _super);
        function PlayAnimationAction(triggerOptions, target, from, to, loop, condition) {
            _super.call(this, triggerOptions, condition);
            this.from = from;
            this.to = to;
            this.loop = loop;
            this._target = target;
        }
        PlayAnimationAction.prototype._prepare = function () {
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
        function StopAnimationAction(triggerOptions, target, condition) {
            _super.call(this, triggerOptions, condition);
            this._target = target;
        }
        StopAnimationAction.prototype._prepare = function () {
        };
        StopAnimationAction.prototype.execute = function () {
            var scene = this._actionManager.getScene();
            scene.stopAnimation(this._target);
        };
        return StopAnimationAction;
    })(BABYLON.Action);
    BABYLON.StopAnimationAction = StopAnimationAction;
    var DoNothingAction = (function (_super) {
        __extends(DoNothingAction, _super);
        function DoNothingAction(triggerOptions, condition) {
            if (triggerOptions === void 0) { triggerOptions = BABYLON.ActionManager.NothingTrigger; }
            _super.call(this, triggerOptions, condition);
        }
        DoNothingAction.prototype.execute = function () {
        };
        return DoNothingAction;
    })(BABYLON.Action);
    BABYLON.DoNothingAction = DoNothingAction;
    var CombineAction = (function (_super) {
        __extends(CombineAction, _super);
        function CombineAction(triggerOptions, children, condition) {
            _super.call(this, triggerOptions, condition);
            this.children = children;
        }
        CombineAction.prototype._prepare = function () {
            for (var index = 0; index < this.children.length; index++) {
                this.children[index]._actionManager = this._actionManager;
                this.children[index]._prepare();
            }
        };
        CombineAction.prototype.execute = function (evt) {
            for (var index = 0; index < this.children.length; index++) {
                this.children[index].execute(evt);
            }
        };
        return CombineAction;
    })(BABYLON.Action);
    BABYLON.CombineAction = CombineAction;
    var ExecuteCodeAction = (function (_super) {
        __extends(ExecuteCodeAction, _super);
        function ExecuteCodeAction(triggerOptions, func, condition) {
            _super.call(this, triggerOptions, condition);
            this.func = func;
        }
        ExecuteCodeAction.prototype.execute = function (evt) {
            this.func(evt);
        };
        return ExecuteCodeAction;
    })(BABYLON.Action);
    BABYLON.ExecuteCodeAction = ExecuteCodeAction;
    var SetParentAction = (function (_super) {
        __extends(SetParentAction, _super);
        function SetParentAction(triggerOptions, target, parent, condition) {
            _super.call(this, triggerOptions, condition);
            this._target = target;
            this._parent = parent;
        }
        SetParentAction.prototype._prepare = function () {
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
    var PlaySoundAction = (function (_super) {
        __extends(PlaySoundAction, _super);
        function PlaySoundAction(triggerOptions, sound, condition) {
            _super.call(this, triggerOptions, condition);
            this._sound = sound;
        }
        PlaySoundAction.prototype._prepare = function () {
        };
        PlaySoundAction.prototype.execute = function () {
            if (this._sound !== undefined)
                this._sound.play();
        };
        return PlaySoundAction;
    })(BABYLON.Action);
    BABYLON.PlaySoundAction = PlaySoundAction;
    var StopSoundAction = (function (_super) {
        __extends(StopSoundAction, _super);
        function StopSoundAction(triggerOptions, sound, condition) {
            _super.call(this, triggerOptions, condition);
            this._sound = sound;
        }
        StopSoundAction.prototype._prepare = function () {
        };
        StopSoundAction.prototype.execute = function () {
            if (this._sound !== undefined)
                this._sound.stop();
        };
        return StopSoundAction;
    })(BABYLON.Action);
    BABYLON.StopSoundAction = StopSoundAction;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.directActions.js.map