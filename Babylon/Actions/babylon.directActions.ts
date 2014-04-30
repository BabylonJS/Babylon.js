module BABYLON {
    export class SwitchBooleanAction extends Action {
        private _target: any;
        private _property: string;

        constructor(trigger: number, public targetType: number, public targetName: string, public propertyPath: string, condition?: Condition) {
            super(trigger, condition);
        }

        public _prepare(): void {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        public execute(): void {
            this._target[this._property] = !this._target[this._property];
        }
    }

    export class SetValueAction extends Action {
        private _target: any;
        private _property: string;

        constructor(trigger: number, public targetType: number, public targetName: string, public propertyPath: string, public value: any, condition?: Condition) {
            super(trigger, condition);
        }

        public _prepare(): void {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        public execute(): void {
            this._target[this._property] = this.value;
        }
    }

    export class PlayAnimationAction extends Action {
        private _target: any;

        constructor(trigger: number, public targetType: number, public targetName: string, public from: number, public to: number, public loop?: boolean, condition?: Condition) {
            super(trigger, condition);
        }

        public _prepare(): void {
            this._target = this._getTarget(this.targetType, this.targetName);
        }

        public execute(): void {
            var scene = this._actionManager.getScene();
            scene.beginAnimation(this._target, this.from, this.to, this.loop);
        }
    }

    export class StopAnimationAction extends Action {
        private _target: any;

        constructor(trigger: number, public targetType: number, public targetName: string, condition?: Condition) {
            super(trigger, condition);
        }

        public _prepare(): void {
            this._target = this._getTarget(this.targetType, this.targetName);
        }

        public execute(): void {
            var scene = this._actionManager.getScene();
            scene.stopAnimation(this._target);
        }
    }

    export class ExecuteCodeAction extends Action {
        constructor(trigger: number, public func: () => void, condition?: Condition) {
            super(trigger, condition);
        }

        public execute(): void {
            this.func();
        }
    }

    export class SetParentAction extends Action {
        private _parent: any;
        private _target: any;

        constructor(trigger: number, public targetType: number, public targetName: string, public parentType: number, public parentName: string, condition?: Condition) {
            super(trigger, condition);
        }

        public _prepare(): void {
            this._target = this._getTarget(this.targetType, this.targetName);
            this._parent = this._getTarget(this.parentType, this.parentName);
        }

        public execute(): void {
            if (this._target.parent === this._parent) {
                return;
            }

            var invertParentWorldMatrix = this._parent.getWorldMatrix().clone();
            invertParentWorldMatrix.invert();

            this._target.position = BABYLON.Vector3.TransformCoordinates(this._target.position, invertParentWorldMatrix);

            this._target.parent = this._parent;
        }
    }
} 