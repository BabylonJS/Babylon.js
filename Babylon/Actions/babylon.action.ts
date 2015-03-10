﻿module BABYLON {
    export class Action {
        public trigger: number;
        public _actionManager: ActionManager;

        private _nextActiveAction: Action;
        private _child: Action;
        private _condition: Condition;
        private _triggerParameter: any;

        constructor(public triggerOptions: any, condition?: Condition) {

            if (triggerOptions.parameter) {
                this.trigger = triggerOptions.trigger;
                this._triggerParameter = triggerOptions.parameter;
            } else {
                this.trigger = triggerOptions;
            }

            this._nextActiveAction = this;
            this._condition = condition;
        }

        // Methods
        public _prepare(): void {
        }

        public getTriggerParameter(): any {
            return this._triggerParameter;
        }

        public _executeCurrent(evt: ActionEvent): void {
            if (this._nextActiveAction._condition) {
                var condition = this._nextActiveAction._condition;
                var currentRenderId = this._actionManager.getScene().getRenderId();

                // We cache the current evaluation for the current frame
                if (condition._evaluationId === currentRenderId) {
                    if (!condition._currentResult) {
                        return;
                    }
                } else {
                    condition._evaluationId = currentRenderId;

                    if (!condition.isValid()) {
                        condition._currentResult = false;
                        return;
                    }

                    condition._currentResult = true;
                }
            }

            this._nextActiveAction.execute(evt);

            if (this._nextActiveAction._child) {

                if (!this._nextActiveAction._child._actionManager) {
                    this._nextActiveAction._child._actionManager = this._actionManager;
                }

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