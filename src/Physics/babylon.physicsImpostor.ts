module BABYLON {

    export interface PhysicsImpostorParameters {
        mass: number;
        friction?: number;
        restitution?: number;
        nativeOptions?: any;
    }

    export class PhysicsImpostor {

        private _physicsEngine: PhysicsEngine;
        //The native cannon/oimo/energy physics body object.
        private _physicsBody: any;
        private _bodyUpdateRequired: boolean = false;

        private _onBeforePhysicsStepCallbacks = new Array<(impostor: PhysicsImpostor) => void>();
        private _onAfterPhysicsStepCallbacks = new Array<(impostor: PhysicsImpostor) => void>();
        private _onPhysicsCollideCallbacks = new Array<(collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void>();

        private _deltaPosition: Vector3 = Vector3.Zero();
        private _deltaRotation: Quaternion = new Quaternion();
        
        //If set, this is this impostor's parent
        private _parent: PhysicsImpostor;

        private _joints: Array<{
            joint: PhysicsJoint,
            otherImpostor: PhysicsImpostor
        }>;

        constructor(private _mesh: AbstractMesh, public type: number, private _options: PhysicsImpostorParameters = { mass: 0 }) {
            //default options params
            this._options.mass = (_options.mass === void 0) ? 0 : _options.mass
            this._options.friction = (_options.friction === void 0) ? 0.2 : _options.friction
            this._options.restitution = (_options.restitution === void 0) ? 0.2 : _options.restitution
            this._physicsEngine = this._mesh.getScene().getPhysicsEngine();
            this._joints = [];
            //If the mesh has a parent, don't initialize the physicsBody. Instead wait for the parent to do that.
            if (!this._mesh.parent) {
                this._init();
            }
        }

        public _init() {
            this._physicsEngine.removeImpostor(this);
            this.physicsBody = null;
            this._parent = this._parent || this._getPhysicsParent();
            if (!this.parent) {
                this._physicsEngine.addImpostor(this);
            }
        }

        private _getPhysicsParent(): PhysicsImpostor {
            if (this.mesh.parent instanceof AbstractMesh) {
                var parentMesh: AbstractMesh = <AbstractMesh>this.mesh.parent;
                return parentMesh.getPhysicsImpostor();
            }
            return;
        }

        public isBodyInitRequired(): boolean {
            return this._bodyUpdateRequired || (!this._physicsBody && !this._parent);
        }

        public setScalingUpdated(updated: boolean) {
            this.forceUpdate();
        }

        public forceUpdate() {
            this._init();
            if (this.parent) {
                this.parent.forceUpdate();
            }
        }

        public get mesh(): AbstractMesh {
            return this._mesh;
        }

        public get physicsBody(): any {
            return this.parent ? this.parent.physicsBody : this._physicsBody;
        }

        public get parent() {
            return this._parent;
        }

        public set physicsBody(physicsBody: any) {
            if (this._physicsBody) {
                this._physicsEngine.getPhysicsPlugin().removePhysicsBody(this);
            }
            this._physicsBody = physicsBody;
            this.resetUpdateFlags();
        }

        public resetUpdateFlags() {
            this._bodyUpdateRequired = false;
        }

        public getOptions() {
            return this._options;
        }

        public getParam(paramName: string) {
            return this._options[paramName];
        }

        public setParam(paramName: string, value: number) {
            this._options[paramName] = value;
            this._bodyUpdateRequired = true;
        }

        public setVelocity(velocity: Vector3) {
            this._physicsEngine.getPhysicsPlugin().setVelocity(this, velocity);
        }
        
        public executeNativeFunction(func: (world: any, physicsBody:any) => void) {
            func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
        }

        public registerBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
            this._onBeforePhysicsStepCallbacks.push(func);
        }

        public unregisterBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
            var index = this._onBeforePhysicsStepCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforePhysicsStepCallbacks.splice(index, 1);
            } else {
                Tools.Warn("Function to remove was not found");
            }
        }

        public registerAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
            this._onAfterPhysicsStepCallbacks.push(func);
        }

        public unregisterAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
            var index = this._onAfterPhysicsStepCallbacks.indexOf(func);

            if (index > -1) {
                this._onAfterPhysicsStepCallbacks.splice(index, 1);
            } else {
                Tools.Warn("Function to remove was not found");
            }
        }

        public registerOnPhysicsCollide(func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void): void {
            this._onPhysicsCollideCallbacks.push(func);
        }

        public unregisterOnPhysicsCollide(func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void): void {
            var index = this._onPhysicsCollideCallbacks.indexOf(func);

            if (index > -1) {
                this._onPhysicsCollideCallbacks.splice(index, 1);
            } else {
                Tools.Warn("Function to remove was not found");
            }
        }

        private _tmpPositionWithDelta: Vector3 = Vector3.Zero();
        private _tmpRotationWithDelta: Quaternion = new Quaternion();

        public beforeStep = () => {

            this.mesh.position.subtractToRef(this._deltaPosition, this._tmpPositionWithDelta);
            //conjugate deltaRotation
            this._tmpRotationWithDelta.copyFrom(this._deltaRotation);
            this._tmpRotationWithDelta.multiplyInPlace(this.mesh.rotationQuaternion);

            this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(this, this._tmpPositionWithDelta, this._tmpRotationWithDelta);

            this._onBeforePhysicsStepCallbacks.forEach((func) => {
                func(this);
            });
        }

        public afterStep = () => {
            this._onAfterPhysicsStepCallbacks.forEach((func) => {
                func(this);
            });

            this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(this);

            this.mesh.position.addInPlace(this._deltaPosition)
            this.mesh.rotationQuaternion.multiplyInPlace(this._deltaRotation);
        }
        
        //event and body object due to cannon's event-based architecture.
        public onCollide = (e: { body: any }) => {
            var otherImpostor = this._physicsEngine.getImpostorWithPhysicsBody(e.body);
            if (otherImpostor) {
                this._onPhysicsCollideCallbacks.forEach((func) => {
                    func(this, otherImpostor);
                })
            }
        }

        public applyForce(force: Vector3, contactPoint: Vector3) {
            this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
        }

        public applyImpulse(force: Vector3, contactPoint: Vector3) {
            this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
        }

        public createJoint(otherImpostor: PhysicsImpostor, jointType: number, jointData: PhysicsJointData) {
            var joint = new PhysicsJoint(jointType, jointData);
            this.addJoint(otherImpostor, joint);
        }

        public addJoint(otherImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            this._joints.push({
                otherImpostor: otherImpostor,
                joint: joint
            })
            this._physicsEngine.addJoint(this, otherImpostor, joint);
        }

        //TODO
        public dispose(disposeChildren: boolean = true) {
            this.physicsBody = null;
            if (this.parent) {
                this.parent.forceUpdate();
            } else {
                this.mesh.getChildMeshes().forEach(function(mesh) {
                    if (mesh.physicsImpostor) {
                        if (disposeChildren) {
                            mesh.physicsImpostor.dispose();
                            mesh.physicsImpostor = null;
                        }
                    }
                })
            }
        }

        public setDeltaPosition(position: Vector3) {
            this._deltaPosition.copyFrom(position);
        }

        public setDeltaRotation(rotation: Quaternion) {
            this._deltaRotation.copyFrom(rotation);
        }
        
        //Impostor types
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
    }

}