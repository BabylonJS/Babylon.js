declare module BABYLON {
    class ActionEvent {
        public source: AbstractMesh;
        public pointerX: number;
        public pointerY: number;
        public meshUnderPointer: AbstractMesh;
        public sourceEvent: any;
        constructor(source: AbstractMesh, pointerX: number, pointerY: number, meshUnderPointer: AbstractMesh, sourceEvent?: any);
        static CreateNew(source: AbstractMesh, evt?: Event): ActionEvent;
        static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent;
    }
    class ActionManager {
        private static _NothingTrigger;
        private static _OnPickTrigger;
        private static _OnLeftPickTrigger;
        private static _OnRightPickTrigger;
        private static _OnCenterPickTrigger;
        private static _OnPointerOverTrigger;
        private static _OnPointerOutTrigger;
        private static _OnEveryFrameTrigger;
        private static _OnIntersectionEnterTrigger;
        private static _OnIntersectionExitTrigger;
        private static _OnKeyDownTrigger;
        private static _OnKeyUpTrigger;
        static NothingTrigger : number;
        static OnPickTrigger : number;
        static OnLeftPickTrigger : number;
        static OnRightPickTrigger : number;
        static OnCenterPickTrigger : number;
        static OnPointerOverTrigger : number;
        static OnPointerOutTrigger : number;
        static OnEveryFrameTrigger : number;
        static OnIntersectionEnterTrigger : number;
        static OnIntersectionExitTrigger : number;
        static OnKeyDownTrigger : number;
        static OnKeyUpTrigger : number;
        public actions: Action[];
        private _scene;
        constructor(scene: Scene);
        public dispose(): void;
        public getScene(): Scene;
        public hasSpecificTriggers(triggers: number[]): boolean;
        public hasPointerTriggers : boolean;
        public hasPickTriggers : boolean;
        public registerAction(action: Action): Action;
        public processTrigger(trigger: number, evt: ActionEvent): void;
        public _getEffectiveTarget(target: any, propertyPath: string): any;
        public _getProperty(propertyPath: string): string;
    }
}
