module BABYLON {
    export class ActionManager {
        // Statics
        public static AlwaysTrigger = 0;
        public static OnPickTrigger = 1;

        public static SceneTarget = 0;
        public static MeshTarget = 1;
        public static LightTarget = 2;
        public static CameraTarget = 3;
        public static MaterialTarget = 4;

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

        public _getTarget(targetType: number, targetName: string): any {
            var scene = this._scene;

            switch (targetType) {
                case ActionManager.SceneTarget:
                    return scene;
                case ActionManager.MeshTarget:
                    return scene.getMeshByName(targetName);
                case ActionManager.LightTarget:
                    return scene.getLightByName(targetName);
                case ActionManager.CameraTarget:
                    return scene.getCameraByName(targetName);
                case ActionManager.MaterialTarget:
                    return scene.getMaterialByName(targetName);
            }

            return null;
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