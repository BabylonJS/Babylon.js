module BABYLON {
    export class Condition {
        public _actionManager: ActionManager;

        public _evaluationId: number;
        public _currentResult: boolean;

        constructor(actionManager: ActionManager) {
            this._actionManager = actionManager;
        }

        public isValid(): boolean {
            return true;
        }

        public _getProperty(propertyPath: string): string {
            return this._actionManager._getProperty(propertyPath);
        }

        public _getEffectiveTarget(target: any, propertyPath: string): any {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        }
    }

    export class ValueCondition extends Condition {
        // Statics
        private static _IsEqual = 0;
        private static _IsDifferent = 1;
        private static _IsGreater = 2;
        private static _IsLesser = 3;

        public static get IsEqual(): number {
            return ValueCondition._IsEqual;
        }

        public static get IsDifferent(): number {
            return ValueCondition._IsDifferent;
        }

        public static get IsGreater(): number {
            return ValueCondition._IsGreater;
        }

        public static get IsLesser(): number {
            return ValueCondition._IsLesser;
        }

        // Members
        public _actionManager: ActionManager;

        private _target: any;
        private _property: string;

        constructor(actionManager: ActionManager, target: any, public propertyPath: string, public value: any, public operator: number = ValueCondition.IsEqual) {
            super(actionManager);

            this._target = this._getEffectiveTarget(target, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        // Methods
        public isValid(): boolean {
            switch (this.operator) {
                case ValueCondition.IsGreater:
                    return this._target[this._property] > this.value;
                case ValueCondition.IsLesser:
                    return this._target[this._property] < this.value;
                case ValueCondition.IsEqual:
                case ValueCondition.IsDifferent:
                    var check: boolean;

                    if (this.value.equals) {
                        check = this.value.equals(this._target[this._property]);
                    } else {
                        check = this.value === this._target[this._property];
                    }
                    return this.operator === ValueCondition.IsEqual ? check : !check;
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

    export class StateCondition extends Condition {
        // Members
        public _actionManager: ActionManager;

        private _target: any;

        constructor(actionManager: ActionManager, target: any, public value: string) {
            super(actionManager);

            this._target = target;
        }

        // Methods
        public isValid(): boolean {
            return this._target.state === this.value;
        }
    }

}