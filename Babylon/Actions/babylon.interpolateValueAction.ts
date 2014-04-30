module BABYLON {
    export class InterpolateValueAction extends Action {
        private _target: any;
        private _property: string;

        constructor(trigger: number, public targetType: number, public targetName: string, public propertyPath: string, public value: any, public duration: number = 1000, condition?: Condition) {
            super(trigger, condition);
        }

        public _prepare(): void {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        public execute(): void {
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

            var dataType: number = Animation.ANIMATIONTYPE_FLOAT;

            if (this.value instanceof Color3) {
                dataType = Animation.ANIMATIONTYPE_COLOR3;
            } else if (this.value instanceof Vector3) {
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
            } else if (this.value instanceof Matrix) {
                dataType = Animation.ANIMATIONTYPE_MATRIX;
            } else if (this.value instanceof Quaternion) {
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
            } 

            var animation = new BABYLON.Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, Animation.ANIMATIONLOOPMODE_CONSTANT);

            animation.setKeys(keys);

            scene.beginDirectAnimation(this._target, [animation], 0, 100);
        }
    }
} 