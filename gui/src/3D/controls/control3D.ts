/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used as base class for controls
     */
    export class Control3D implements IDisposable, IBehaviorAware<Control3D> {
        /** @hidden */
        public _host: GUI3DManager;
        private _mesh: Nullable<Mesh>;

        /**
         * Gets or sets the parent container
         */
        public parent: Nullable<Container3D>;

        // Behaviors
        private _behaviors = new Array<Behavior<Control3D>>();

        /**
         * Gets the list of attached behaviors
         * @see http://doc.babylonjs.com/features/behaviour
         */
        public get behaviors(): Behavior<Control3D>[] {
            return this._behaviors;
        }        

        /**
         * Attach a behavior to the control
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current control
         */
        public addBehavior(behavior: Behavior<Control3D>): Control3D {
            var index = this._behaviors.indexOf(behavior);

            if (index !== -1) {
                return this;
            }

            behavior.init();
            let scene = this._host.scene;
            if (scene.isLoading) {
                // We defer the attach when the scene will be loaded
                scene.onDataLoadedObservable.addOnce(() => {
                    behavior.attach(this);
                });
            } else {
                behavior.attach(this);
            }
            this._behaviors.push(behavior);

            return this;
        }

        /**
         * Remove an attached behavior
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current control
         */
        public removeBehavior(behavior: Behavior<Control3D>): Control3D {
            var index = this._behaviors.indexOf(behavior);

            if (index === -1) {
                return this;
            }

            this._behaviors[index].detach();
            this._behaviors.splice(index, 1);

            return this;
        }        

        /**
         * Gets an attached behavior by name
         * @param name defines the name of the behavior to look for
         * @see http://doc.babylonjs.com/features/behaviour
         * @returns null if behavior was not found else the requested behavior
         */
        public getBehaviorByName(name: string): Nullable<Behavior<Control3D>> {
            for (var behavior of this._behaviors) {
                if (behavior.name === name) {
                    return behavior;
                }
            }

            return null;
        }        

        /**
         * Creates a new control
         * @param name defines the control name
         */
        constructor(
            /** Defines the control name */
            public name?: string) {
        }

        /**
         * Gets a string representing the class name
         */
        public get typeName(): string {
            return this._getTypeName();
        }

        protected _getTypeName(): string {
            return "Control3D";
        }

        /**
         * Get the attached mesh used to render the control
         * @param scene defines the scene where the mesh must be attached
         * @returns the attached mesh or null if none
         */        
        public getAttachedMesh(scene: Scene): Nullable<Mesh> {
            if (!this._mesh) {
                this._mesh = this._createMesh(scene);
            }

            return this._mesh;
        }

        /**
         * Mesh creation.
         * Can be overriden by children
         * @param scene defines the scene where the mesh must be attached
         * @returns the attached mesh or null if none
         */
        protected _createMesh(scene: Scene): Nullable<Mesh> {
            // Do nothing by default
            return null;
        }

        /**
         * Releases all associated resources
         */
        public dispose() {
            // Behaviors
            for (var behavior of this._behaviors) {
                behavior.detach();
            }
        }
    }
}