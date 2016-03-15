var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var InterpolateValueAction = (function (_super) {
        __extends(InterpolateValueAction, _super);
        function InterpolateValueAction(triggerOptions, target, propertyPath, value, duration, condition, stopOtherAnimations, onInterpolationDone) {
            if (duration === void 0) { duration = 1000; }
            _super.call(this, triggerOptions, condition);
            this.propertyPath = propertyPath;
            this.value = value;
            this.duration = duration;
            this.stopOtherAnimations = stopOtherAnimations;
            this.onInterpolationDone = onInterpolationDone;
            this._target = target;
        }
        InterpolateValueAction.prototype._prepare = function () {
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };
        InterpolateValueAction.prototype.execute = function () {
            var scene = this._actionManager.getScene();
            var keys = [
                {
                    frame: 0,
                    value: this._target[this._property]
                }, {
                    frame: 100,
                    value: this.value
                }
            ];
            var dataType;
            if (typeof this.value === "number") {
                dataType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
            }
            else if (this.value instanceof BABYLON.Color3) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_COLOR3;
            }
            else if (this.value instanceof BABYLON.Vector3) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            }
            else if (this.value instanceof BABYLON.Matrix) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
            }
            else if (this.value instanceof BABYLON.Quaternion) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
            }
            else {
                BABYLON.Tools.Warn("InterpolateValueAction: Unsupported type (" + typeof this.value + ")");
                return;
            }
            var animation = new BABYLON.Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            animation.setKeys(keys);
            if (this.stopOtherAnimations) {
                scene.stopAnimation(this._target);
            }
            scene.beginDirectAnimation(this._target, [animation], 0, 100, false, 1, this.onInterpolationDone);
        };
        return InterpolateValueAction;
    })(BABYLON.Action);
    BABYLON.InterpolateValueAction = InterpolateValueAction;
})(BABYLON || (BABYLON = {}));
