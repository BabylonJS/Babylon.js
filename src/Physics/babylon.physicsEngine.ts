module BABYLON {
    export interface IPhysicsEnginePlugin {
        name: string;
        initialize(iterations?: number);
        setGravity(gravity: Vector3): void;
        getGravity(): Vector3;
        runOneStep(delta: number): void;
        registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        unregisterMesh(mesh: AbstractMesh);
        applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        dispose(): void;
        isSupported(): boolean;
        updateBodyPosition(mesh: AbstractMesh): void;
        getWorldObject(): any; //Will return the physics world object of the engine used.
        getPhysicsBodyOfMesh(mesh: AbstractMesh): any;
    }

    export interface PhysicsBodyCreationOptions {
        mass: number;
        friction: number;
        restitution: number;
    }

    export interface PhysicsCompoundBodyPart {
        mesh: Mesh;
        impostor: number;
    }

    export class PhysicsEngine {
        public gravity: Vector3;

        private _currentPlugin: IPhysicsEnginePlugin;

        constructor(plugin?: IPhysicsEnginePlugin) {
            this._currentPlugin = plugin || new OimoJSPlugin();
        }

        public _initialize(gravity?: Vector3) {
            this._currentPlugin.initialize();
            this._setGravity(gravity);
        }

        public _runOneStep(delta: number): void {
            if (delta > 0.1) {
                delta = 0.1;
            } else if (delta <= 0) {
                delta = 1.0 / 60.0;
            }

            this._currentPlugin.runOneStep(delta);
        }

        public _setGravity(gravity: Vector3): void {
            this.gravity = gravity || new Vector3(0, -9.807, 0);
            this._currentPlugin.setGravity(this.gravity);
        }

        public _getGravity(): Vector3 {
            return this._currentPlugin.getGravity();
        }

        public _registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any {
            return this._currentPlugin.registerMesh(mesh, impostor, options);
        }

        public _registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any {
            return this._currentPlugin.registerMeshesAsCompound(parts, options);
        }

        public _unregisterMesh(mesh: AbstractMesh): void {
            this._currentPlugin.unregisterMesh(mesh);
        }

        public _applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void {
            this._currentPlugin.applyImpulse(mesh, force, contactPoint);
        }

        public _createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean {
            return this._currentPlugin.createLink(mesh1, mesh2, pivot1, pivot2, options);
        }

        public _updateBodyPosition(mesh: AbstractMesh): void {
            this._currentPlugin.updateBodyPosition(mesh);
        }

        public dispose(): void {
            this._currentPlugin.dispose();
        }

        public isSupported(): boolean {
            return this._currentPlugin.isSupported();
        }

        public getPhysicsBodyOfMesh(mesh: AbstractMesh) {
            return this._currentPlugin.getPhysicsBodyOfMesh(mesh);
        }

        public getPhysicsPluginName(): string {
            return this._currentPlugin.name;
        }

        // Statics
        public static NoImpostor = 0;
        public static SphereImpostor = 1;
        public static BoxImpostor = 2;
        public static PlaneImpostor = 3;
        public static MeshImpostor = 4;
        public static CapsuleImpostor = 5;
        public static ConeImpostor = 6;
        public static CylinderImpostor = 7;
        public static ConvexHullImpostor = 8;
        public static HeightmapImpostor = 9;
        public static Epsilon = 0.001;
    }
}