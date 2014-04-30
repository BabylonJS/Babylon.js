var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var InterpolateValueAction = (function (_super) {
        __extends(InterpolateValueAction, _super);
        function InterpolateValueAction(trigger, targetType, targetName, propertyPath, value, duration, condition) {
            if (typeof duration === "undefined") { duration = 1000; }
            _super.call(this, trigger, condition);
            this.targetType = targetType;
            this.targetName = targetName;
            this.propertyPath = propertyPath;
            this.value = value;
            this.duration = duration;
        }
        InterpolateValueAction.prototype._prepare = function () {
            this._target = this._getTarget(this.targetType, this.targetName);
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

            var dataType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;

            if (this.value instanceof BABYLON.Color3) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_COLOR3;
            } else if (this.value instanceof BABYLON.Vector3) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            } else if (this.value instanceof BABYLON.Matrix) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
            } else if (this.value instanceof BABYLON.Quaternion) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
            }

            var animation = new BABYLON.Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

            animation.setKeys(keys);

            scene.beginDirectAnimation(this._target, [animation], 0, 100);
        };
        return InterpolateValueAction;
    })(BABYLON.Action);
    BABYLON.InterpolateValueAction = InterpolateValueAction;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.interpolateValueAction.js.map
