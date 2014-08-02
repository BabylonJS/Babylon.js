module BABYLON {

    export class ActionEvent {
        constructor(public source: AbstractMesh, public pointerX: number, public pointerY: number, public meshUnderPointer: AbstractMesh, public sourceEvent?: any) {
            
        }

        public static CreateNew(source: AbstractMesh): ActionEvent {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer);
        }

        public static CreateNewFromScene(scene: Scene, evt:Event): ActionEvent {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        }
    }

    export class ActionManager {
        // Statics
        private static _NothingTrigger = 0;
        private static _OnPickTrigger = 1;
        private static _OnLeftPickTrigger = 2;
        private static _OnRightPickTrigger = 3;
        private static _OnCenterPickTrigger = 4;
        private static _OnPointerOverTrigger = 5;
        private static _OnPointerOutTrigger = 6;
        private static _OnEveryFrameTrigger = 7;
        private static _OnIntersectionEnterTrigger = 8;
        private static _OnIntersectionExitTrigger = 9;
        private static _OnKeyDownTrigger = 10;
        private static _OnKeyUpTrigger = 11;

        public static get NothingTrigger(): number {
            return ActionManager._NothingTrigger;
        }

        public static get OnPickTrigger(): number {
            return ActionManager._OnPickTrigger;
        }

        public static get OnLeftPickTrigger(): number {
            return ActionManager._OnLeftPickTrigger;
        }

        public static get OnRightPickTrigger(): number {
            return ActionManager._OnRightPickTrigger;
        }

        public static get OnCenterPickTrigger(): number {
            return ActionManager._OnCenterPickTrigger;
        }

        public static get OnPointerOverTrigger(): number {
            return ActionManager._OnPointerOverTrigger;
        }

        public static get OnPointerOutTrigger(): number {
            return ActionManager._OnPointerOutTrigger;
        }

        public static get OnEveryFrameTrigger(): number {
            return ActionManager._OnEveryFrameTrigger;
        }

        public static get OnIntersectionEnterTrigger(): number {
            return ActionManager._OnIntersectionEnterTrigger;
        }

        public static get OnIntersectionExitTrigger(): number {
            return ActionManager._OnIntersectionExitTrigger;
        }

        public static get OnKeyDownTrigger(): number {
            return ActionManager._OnKeyDownTrigger;
        }

        public static get OnKeyUpTrigger(): number {
            return ActionManager._OnKeyUpTrigger;
        }
        // Members
        public actions = new Array<Action>();

        private _scene: Scene;

        constructor(scene: Scene) {
            this._scene = scene;

            scene._actionManagers.push(this);
        }

        // Methods
        public dispose(): void {
            var index = this._scene._actionManagers.indexOf(this);

            if (index > -1) {
                this._scene._actionManagers.splice(index, 1);
            }
        }

        public getScene(): Scene {
            return this._scene;
        }

        public hasSpecificTriggers(triggers: number[]): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (triggers.indexOf(action.trigger) > -1) {
                    return true;
                }
            }

            return false;
        }

        public get hasPointerTriggers(): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPointerOutTrigger) {
                    return true;
                }
            }

            return false;
        }

        public get hasPickTriggers(): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnCenterPickTrigger) {
                    return true;
                }
            }

            return false;
        }

        public registerAction(action: Action): Action {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    Tools.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                    return null;
                }
            }


            this.actions.push(action);

            action._actionManager = this;
            action._prepare();

            return action;
        }

        public processTrigger(trigger: number, evt: ActionEvent): void {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    if (trigger == ActionManager.OnKeyUpTrigger || trigger == ActionManager.OnKeyDownTrigger) {
                        var parameter = action.getTriggerParameter();

                        if (parameter) {
                            if (evt.sourceEvent.key !== parameter) {
                                continue;
                            }
                        }
                    }

                    action._executeCurrent(evt);
                }
            }
        }

        public _getEffectiveTarget(target: any, propertyPath: string): any {
            var properties = propertyPath.split(".");

            for (var index = 0; index < properties.length - 1; index++) {
                target = target[properties[index]];
            }

            return target;
        }

        public _getProperty(propertyPath: string): string {
            var properties = propertyPath.split(".");

            return properties[properties.length - 1];
        }
    }
} 