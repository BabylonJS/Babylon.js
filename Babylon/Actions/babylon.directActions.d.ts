declare module BABYLON {
    class SwitchBooleanAction extends Action {
        public propertyPath: string;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class SetStateAction extends Action {
        public value: string;
        private _target;
        constructor(triggerOptions: any, target: any, value: string, condition?: Condition);
        public execute(): void;
    }
    class SetValueAction extends Action {
        public propertyPath: string;
        public value: any;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class IncrementValueAction extends Action {
        public propertyPath: string;
        public value: any;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class PlayAnimationAction extends Action {
        public from: number;
        public to: number;
        public loop: boolean;
        private _target;
        constructor(triggerOptions: any, target: any, from: number, to: number, loop?: boolean, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class StopAnimationAction extends Action {
        private _target;
        constructor(triggerOptions: any, target: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class DoNothingAction extends Action {
        constructor(triggerOptions?: any, condition?: Condition);
        public execute(): void;
    }
    class CombineAction extends Action {
        public children: Action[];
        constructor(triggerOptions: any, children: Action[], condition?: Condition);
        public _prepare(): void;
        public execute(evt: ActionEvent): void;
    }
    class ExecuteCodeAction extends Action {
        public func: (evt: ActionEvent) => void;
        constructor(triggerOptions: any, func: (evt: ActionEvent) => void, condition?: Condition);
        public execute(evt: ActionEvent): void;
    }
    class SetParentAction extends Action {
        private _parent;
        private _target;
        constructor(triggerOptions: any, target: any, parent: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
}
