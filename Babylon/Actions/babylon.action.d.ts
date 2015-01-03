declare module BABYLON {
    class Action {
        public triggerOptions: any;
        public trigger: number;
        public _actionManager: ActionManager;
        private _nextActiveAction;
        private _child;
        private _condition;
        private _triggerParameter;
        constructor(triggerOptions: any, condition?: Condition);
        public _prepare(): void;
        public getTriggerParameter(): any;
        public _executeCurrent(evt: ActionEvent): void;
        public execute(evt: ActionEvent): void;
        public then(action: Action): Action;
        public _getProperty(propertyPath: string): string;
        public _getEffectiveTarget(target: any, propertyPath: string): any;
    }
}
