module BABYLON {
    export class Condition {
        public _actionManager: ActionManager;

        constructor(actionManager: ActionManager) {
            this._actionManager = actionManager;
        }

        public isValid(): boolean {
            return true;
        }

        public _getTarget(targetType: number, targetName: string): any {
            return this._actionManager._getTarget(targetType, targetName);
        }

        public _getProperty(propertyPath: string): string {
            return this._actionManager._getProperty(propertyPath);
        }

        public _getEffectiveTarget(target: any, propertyPath: string): any {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        }
    }

    export class StateCondition extends Condition {
        // Statics
        public static IsEqual = 0;
        public static IsDifferent = 1;
        public static IsGreater= 2;
        public static IsLesser = 3;

        // Members
        public _actionManager: ActionManager;

        private _target: any;
        private _property: string;

        constructor(actionManager: ActionManager, public targetType: number, public targetName: string, public propertyPath: string, public value: any, public operator: number = StateCondition.IsEqual) {
            super(actionManager);

            this._target = this._getTarget(this.targetType, this.targetName);
            this._target = this._getEffectiveTarget(this._target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        // Methods
        public isValid(): boolean {
            switch (this.operator) {
                case StateCondition.IsGreater:
                    return this._target[this._property] > this.value;
                case StateCondition.IsLesser:
                    return this._target[this._property] < this.value;
                case StateCondition.IsEqual:
                case StateCondition.IsDifferent:
                    var check: boolean;

                    if (this.value.equals) {
                        check = this.value.equals(this._target[this._property]);
                    } else {
                        check = this.value === this._target[this._property];
                    }
                    return this.operator === StateCondition.IsEqual ? check: !check;
            }

            return false;
        }
    }

    export class PredicateCondition extends Condition {
        // Members
        public _actionManager: ActionManager;


        constructor(actionManager: ActionManager, public predicate: () => boolean) {
            super(actionManager);
        }

        public isValid(): boolean {
            return this.predicate();
        }
    }
}