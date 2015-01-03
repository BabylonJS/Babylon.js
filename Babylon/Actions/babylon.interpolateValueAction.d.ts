declare module BABYLON {
    class InterpolateValueAction extends Action {
        public propertyPath: string;
        public value: any;
        public duration: number;
        public stopOtherAnimations: boolean;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, duration?: number, condition?: Condition, stopOtherAnimations?: boolean);
        public _prepare(): void;
        public execute(): void;
    }
}
