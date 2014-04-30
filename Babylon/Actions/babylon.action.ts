module BABYLON {
    export class Action {
        public _actionManager: ActionManager;

        private _nextActiveAction;
        private _child;
        private _condition: Condition;

        constructor(public trigger: number, condition?: Condition) {
            this._nextActiveAction = this;
            this._condition = condition;
        }

        // Methods
        public _prepare(): void {
        }

        public _executeCurrent(): void {
            if (this._condition) {
                if (!this._condition.isValid()) {
                    return;
                }
            }

            this._nextActiveAction.execute();

            if (this._nextActiveAction._child) {
                this._nextActiveAction = this._nextActiveAction._child;
            } else {
                this._nextActiveAction = this;
            }
        }

        public execute(): void {

        }

        public then(action: Action): Action {
            this._child = action;

            action._actionManager = this._actionManager;
            action._prepare();

            return action;
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
}