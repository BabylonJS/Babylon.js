module BABYLON {
    export interface Scene {
        /** @hidden (Backing field) */        
        _physicsEngine: Nullable<IPhysicsEngine>;             

        /**
         * Gets the current physics engine
         * @returns a IPhysicsEngine or null if none attached
         */
        getPhysicsEngine(): Nullable<IPhysicsEngine>;

        /**
         * Enables physics to the current scene
         * @param gravity defines the scene's gravity for the physics engine
         * @param plugin defines the physics engine to be used. defaults to OimoJS.
         * @return a boolean indicating if the physics engine was initialized
         */
        enablePhysics(gravity: Nullable<Vector3>, plugin?: IPhysicsEnginePlugin): boolean;

        /** 
         * Disables and disposes the physics engine associated with the scene
         */
        disablePhysicsEngine(): void;

        /**
         * Gets a boolean indicating if there is an active physics engine
         * @returns a boolean indicating if there is an active physics engine
         */
        isPhysicsEnabled(): boolean;   

        /**
         * Deletes a physics compound impostor
         * @param compound defines the compound to delete
         */
        deleteCompoundImpostor(compound: any): void;

        /**
        * An event triggered when physic simulation is about to be run
        */
        onBeforePhysicsObservable: Observable<Scene>;

        /**
         * An event triggered when physic simulation has been done
         */
        onAfterPhysicsObservable: Observable<Scene>;
    }

    /** 
     * Gets the current physics engine
     * @returns a IPhysicsEngine or null if none attached
     */
    Scene.prototype.getPhysicsEngine = function(): Nullable<IPhysicsEngine> {
        return this._physicsEngine;
    }

    /**
     * Enables physics to the current scene
     * @param gravity defines the scene's gravity for the physics engine
     * @param plugin defines the physics engine to be used. defaults to OimoJS.
     * @return a boolean indicating if the physics engine was initialized
     */
    Scene.prototype.enablePhysics = function(gravity: Nullable<Vector3> = null, plugin?: IPhysicsEnginePlugin): boolean {
        if (this._physicsEngine) {
            return true;
        }
        
        // Register the component to the scene
        let component = this._getComponent(SceneComponentConstants.NAME_PHYSICSENGINE) as PhysicsEngineSceneComponent;
        if (!component) {
            component = new PhysicsEngineSceneComponent(this);
            this._addComponent(component);
        }

        try {
            this._physicsEngine = new PhysicsEngine(gravity, plugin);
            return true;
        } catch (e) {
            Tools.Error(e.message);
            return false;
        }
    }

    /** 
     * Disables and disposes the physics engine associated with the scene
     */
    Scene.prototype.disablePhysicsEngine = function(): void {
        if (!this._physicsEngine) {
            return;
        }

        this._physicsEngine.dispose();
        this._physicsEngine = null;
    }

    /**
     * Gets a boolean indicating if there is an active physics engine
     * @returns a boolean indicating if there is an active physics engine
     */
    Scene.prototype.isPhysicsEnabled = function(): boolean {
        return this._physicsEngine !== undefined;
    }

    /**
     * Deletes a physics compound impostor
     * @param compound defines the compound to delete
     */
    Scene.prototype.deleteCompoundImpostor = function(compound: any): void {
        var mesh: AbstractMesh = compound.parts[0].mesh;

        if (mesh.physicsImpostor) {
            mesh.physicsImpostor.dispose(/*true*/);
            mesh.physicsImpostor = null;
        }
    }

    /** @hidden */
    Scene.prototype._advancePhysicsEngineStep = function(step: number) {
        if (this._physicsEngine) {
            this.onBeforePhysicsObservable.notifyObservers(this);
            this._physicsEngine._step(step / 1000);
            this.onAfterPhysicsObservable.notifyObservers(this);
        }
    }
   
    /**
     * Defines the physics engine scene component responsible to manage a physics engine
     */
    export class PhysicsEngineSceneComponent implements ISceneComponent {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        public readonly name = SceneComponentConstants.NAME_PHYSICSENGINE;

        /**
         * The scene the component belongs to.
         */
        public scene: Scene;

        /**
         * Creates a new instance of the component for the given scene
         * @param scene Defines the scene to register the component in
         */
        constructor(scene: Scene) {
            this.scene = scene;
            this.scene.onBeforePhysicsObservable = new Observable<Scene>();
            this.scene.onAfterPhysicsObservable = new Observable<Scene>();

            // Replace the function used to get the deterministic frame time
            this.scene.getDeterministicFrameTime = () => {    
                if (this.scene._physicsEngine) {
                    return this.scene._physicsEngine.getTimeStep() * 1000;
                }

                return 1000.0 / 60.0;
            }        
        }

        /**
         * Registers the component in a given scene
         */
        public register(): void {
        }

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        public rebuild(): void {
            // Nothing to do for this component
        }

        /**
         * Disposes the component and the associated ressources
         */
        public dispose(): void {
            this.scene.onBeforePhysicsObservable.clear();
            this.scene.onAfterPhysicsObservable.clear();

            if (this.scene._physicsEngine) {
                this.scene.disablePhysicsEngine();
            }
        }
    }
}