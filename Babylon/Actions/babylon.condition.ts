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

    export class StateCondition extends Condition {
        // Statics
        private static _IsEqual = 0;
        private static _IsDifferent = 1;
        private static _IsGreater = 2;
        private static _IsLesser = 3;

        public static get IsEqual(): number {
            return StateCondition._IsEqual;
        }

        public static get IsDifferent(): number {
            return StateCondition._IsDifferent;
        }

        public static get IsGreater(): number {
            return StateCondition._IsGreater;
        }

        public static get IsLesser(): number {
            return StateCondition._IsLesser;
        }

        // Members
        public _actionManager: ActionManager;

        private _target: any;
        private _property: string;

        constructor(actionManager: ActionManager, target: any, public propertyPath: string, public value: any, public operator: number = StateCondition.IsEqual) {
            super(actionManager);

            this._target = this._getEffectiveTarget(target, this.propertyPath);
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