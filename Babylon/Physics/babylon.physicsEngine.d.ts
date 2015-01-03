declare module BABYLON {
    interface IPhysicsEnginePlugin {
        initialize(iterations?: number): any;
        setGravity(gravity: Vector3): void;
        runOneStep(delta: number): void;
        registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        unregisterMesh(mesh: AbstractMesh): any;
        applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        dispose(): void;
        isSupported(): boolean;
        updateBodyPosition(mesh: AbstractMesh): void;
    }
    interface PhysicsBodyCreationOptions {
        mass: number;
        friction: number;
        restitution: number;
    }
    interface PhysicsCompoundBodyPart {
        mesh: Mesh;
        impostor: number;
    }
    class PhysicsEngine {
        public gravity: Vector3;
        private _currentPlugin;
        constructor(plugin?: IPhysicsEnginePlugin);
        public _initialize(gravity?: Vector3): void;
        public _runOneStep(delta: number): void;
        public _setGravity(gravity: Vector3): void;
        public _registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        public _registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        public _unregisterMesh(mesh: AbstractMesh): void;
        public _applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        public _createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        public _updateBodyPosition(mesh: AbstractMesh): void;
        public dispose(): void;
        public isSupported(): boolean;
        static NoImpostor: number;
        static SphereImpostor: number;
        static BoxImpostor: number;
        static PlaneImpostor: number;
        static MeshImpostor: number;
        static CapsuleImpostor: number;
        static ConeImpostor: number;
        static CylinderImpostor: number;
        static ConvexHullImpostor: number;
        static Epsilon: number;
    }
}
