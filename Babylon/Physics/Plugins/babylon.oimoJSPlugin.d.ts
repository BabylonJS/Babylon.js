declare module BABYLON {
    class OimoJSPlugin implements IPhysicsEnginePlugin {
        private _world;
        private _registeredMeshes;
        private _checkWithEpsilon(value);
        public initialize(iterations?: number): void;
        public setGravity(gravity: Vector3): void;
        public registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        public registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        private _createBodyAsCompound(part, options, initialMesh);
        public unregisterMesh(mesh: AbstractMesh): void;
        private _unbindBody(body);
        /**
        * Update the body position according to the mesh position
        * @param mesh
        */
        public updateBodyPosition: (mesh: AbstractMesh) => void;
        public applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        public createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        public dispose(): void;
        public isSupported(): boolean;
        private _getLastShape(body);
        public runOneStep(time: number): void;
    }
}
