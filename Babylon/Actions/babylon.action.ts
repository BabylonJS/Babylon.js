module BABYLON {
    export class Action {
        public _actionManager: ActionManager;

        private _nextActiveAction: Action;
        private _child: Action;
        private _condition: Condition;

        constructor(public trigger: number, condition?: Condition) {
            this._nextActiveAction = this;
            this._condition = condition;
        }

        // Methods
        public _prepare(): void {
        }

        public _executeCurrent(evt: ActionEvent): void {
            if (this._condition) {
                var currentRenderId = this._actionManager.getScene().getRenderId();

                // We cache the current evaluation for the current frame
                if (this._condition._evaluationId === currentRenderId) {
                    if (!this._condition._currentResult) {
                        return;
                    }
                } else {
                    this._condition._evaluationId = currentRenderId;

                    if (!this._condition.isValid()) {
                        this._condition._currentResult = false;
                        return;
                    }

                    this._condition._currentResult = true;
                }
            }

            this._nextActiveAction.execute(evt);

            if (this._nextActiveAction._child) {
                this._nextActiveAction = this._nextActiveAction._child;
            } else {
                this._nextActiveAction = this;
            }
        }

        public execute(evt: ActionEvent): void {

        }

        public then(action: Action): Action {
            this._child = action;

            action._actionManager = this._actionManager;
            action._prepare();

            return action;
        }

        public _getProperty(propertyPath: string): string {
            return this._actionManager._getProperty(propertyPath);
        }

        public _getEffectiveTarget(target: any, propertyPath: string): any {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        }
    }
}