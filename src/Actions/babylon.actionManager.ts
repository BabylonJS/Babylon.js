module BABYLON {

    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    export class ActionEvent {
        /**
         * @constructor
         * @param source The mesh that triggered the action.
         * @param pointerX the X mouse cursor position at the time of the event
         * @param pointerY the Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        constructor(public source: AbstractMesh, public pointerX: number, public pointerY: number, public meshUnderPointer: AbstractMesh, public sourceEvent?: any) {

        }

        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source the source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        public static CreateNew(source: AbstractMesh, evt?: Event): ActionEvent {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        }

        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        public static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        }
    }

    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
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
        private static _OnPickUpTrigger = 12;

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
        public static get OnPickUpTrigger(): number {
            return ActionManager._OnPickUpTrigger;
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

        /**
         * Does this action manager handles actions of any of the given triggers
         * @param {number[]} triggers - the triggers to be tested
         * @return {boolean} whether one (or more) of the triggers is handeled 
         */
        public hasSpecificTriggers(triggers: number[]): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (triggers.indexOf(action.trigger) > -1) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Does this action manager handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled 
         */
        public hasSpecificTrigger(trigger: number): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Does this action manager has pointer triggers
         * @return {boolean} whether or not it has pointer triggers
         */
        public get hasPointerTriggers(): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPointerOutTrigger) {
                    return true;
                }
                if (action.trigger == ActionManager._OnPickUpTrigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Does this action manager has pick triggers
         * @return {boolean} whether or not it has pick triggers
         */
        public get hasPickTriggers(): boolean {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnCenterPickTrigger) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Registers an action to this action manager
         * @param {BABYLON.Action} action - the action to be registered
         * @return {BABYLON.Action} the action amended (prepared) after registration
         */
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

        /**
         * Process a specific trigger
         * @param {number} trigger - the trigger to process
         * @param evt {BABYLON.ActionEvent} the event details to be processed
         */
        public processTrigger(trigger: number, evt: ActionEvent): void {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];

                if (action.trigger === trigger) {
                    if (trigger === ActionManager.OnKeyUpTrigger
                        || trigger === ActionManager.OnKeyDownTrigger) {
                        var parameter = action.getTriggerParameter();

                        if (parameter) {
                            var unicode = evt.sourceEvent.charCode ? evt.sourceEvent.charCode : evt.sourceEvent.keyCode;
                            var actualkey = String.fromCharCode(unicode).toLowerCase();
                            if (actualkey !== parameter.toLowerCase()) {
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