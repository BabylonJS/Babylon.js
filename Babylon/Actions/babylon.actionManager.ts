module BABYLON {
    export class ActionManager {
        // Statics
        public static NoneTrigger = 0;
        public static OnPickTrigger = 1;
        public static OnPointerOverTrigger = 2;
        public static OnPointerOutTrigger = 3;
        public static OnEveryFrameTrigger = 4;

        // Members
        public actions = new Array<Action>();

        private _scene: Scene;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        // Methods
        public getScene(): Scene {
            return this._scene;
        }

        public registerAction(action: Action): Action {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    console.warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                    return null;
                }
            }


            this.actions.push(action);

            action._actionManager = this;
            action._prepare();

            return action;
        }

        public processTrigger(trigger: number): void {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    action._executeCurrent();
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