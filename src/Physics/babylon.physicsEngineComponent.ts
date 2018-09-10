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
}