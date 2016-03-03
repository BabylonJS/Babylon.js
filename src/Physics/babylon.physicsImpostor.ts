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
        private _onPhysicsCollideCallbacks: Array<{ callback: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void, otherImpostors: Array<PhysicsImpostor> }> = []

        private _deltaPosition: Vector3 = Vector3.Zero();
        private _deltaRotation: Quaternion;
        private _deltaRotationConjugated: Quaternion;
        
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

        /**
         * This function will completly initialize this impostor.
         * It will create a new body - but only if this mesh has no parent.
         * If it has, this impostor will not be used other than to define the impostor
         * of the child mesh.
         */
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

        /**
         * Should a new body be generated.
         */
        public isBodyInitRequired(): boolean {
            return this._bodyUpdateRequired || (!this._physicsBody && !this._parent);
        }

        public setScalingUpdated(updated: boolean) {
            this.forceUpdate();
        }

        /**
         * Force a regeneration of this or the parent's impostor's body.
         * Use under cautious - This will remove all joints already implemented.
         */
        public forceUpdate() {
            this._init();
            if (this.parent) {
                this.parent.forceUpdate();
            }
        }

        public get mesh(): AbstractMesh {
            return this._mesh;
        }

        /**
         * Gets the body that holds this impostor. Either its own, or its parent.
         */
        public get physicsBody(): any {
            return this._parent ? this._parent.physicsBody : this._physicsBody;
        }

        public get parent() {
            return this._parent;
        }

        /**
         * Set the physics body. Used mainly by the physics engine/plugin
         */
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

        /**
         * Get a specific parametes from the options parameter.
         */
        public getParam(paramName: string) {
            return this._options[paramName];
        }

        /**
         * Sets a specific parameter in the options given to the physics plugin
         */
        public setParam(paramName: string, value: number) {
            this._options[paramName] = value;
            this._bodyUpdateRequired = true;
        }

        /**
         * Set the body's linear velocity.
         */
        public setLinearVelocity(velocity: Vector3) {
            this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
        }
        
        /**
         * Set the body's linear velocity.
         */
        public setAngularVelocity(velocity: Vector3) {
            this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, velocity);
        }
        
        /**
         * Execute a function with the physics plugin native code.
         * Provide a function the will have two variables - the world object and the physics body object.
         */
        public executeNativeFunction(func: (world: any, physicsBody: any) => void) {
            func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
        }

        /**
         * Register a function that will be executed before the physics world is stepping forward.
         */
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

        /**
         * Register a function that will be executed after the physics step
         */
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

        /**
         * register a function that will be executed when this impostor collides against a different body.
         */
        public registerOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void): void {
            var collidedAgainstList: Array<PhysicsImpostor> = collideAgainst instanceof Array ? <Array<PhysicsImpostor>>collideAgainst : [<PhysicsImpostor>collideAgainst]
            this._onPhysicsCollideCallbacks.push({ callback: func, otherImpostors: collidedAgainstList });
        }

        public unregisterOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor | Array<PhysicsImpostor>) => void): void {
            var collidedAgainstList: Array<PhysicsImpostor> = collideAgainst instanceof Array ? <Array<PhysicsImpostor>>collideAgainst : [<PhysicsImpostor>collideAgainst]
            var index = this._onPhysicsCollideCallbacks.indexOf({ callback: func, otherImpostors: collidedAgainstList });

            if (index > -1) {
                this._onPhysicsCollideCallbacks.splice(index, 1);
            } else {
                Tools.Warn("Function to remove was not found");
            }
        }

        private _tmpPositionWithDelta: Vector3 = Vector3.Zero();
        private _tmpRotationWithDelta: Quaternion = new Quaternion();

        /**
         * this function is executed by the physics engine.
         */
        public beforeStep = () => {

            this.mesh.position.subtractToRef(this._deltaPosition, this._tmpPositionWithDelta);
            //conjugate deltaRotation
            if (this._deltaRotationConjugated) {
                this.mesh.rotationQuaternion.multiplyToRef(this._deltaRotationConjugated, this._tmpRotationWithDelta);
            } else {
                this._tmpRotationWithDelta.copyFrom(this.mesh.rotationQuaternion);
            }

            this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(this, this._tmpPositionWithDelta, this._tmpRotationWithDelta);

            this._onBeforePhysicsStepCallbacks.forEach((func) => {
                func(this);
            });
        }

        /**
         * this function is executed by the physics engine.
         */
        public afterStep = () => {
            this._onAfterPhysicsStepCallbacks.forEach((func) => {
                func(this);
            });

            this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(this);

            this.mesh.position.addInPlace(this._deltaPosition)
            if (this._deltaRotation) {
                this.mesh.rotationQuaternion.multiplyInPlace(this._deltaRotation);
            }
        }
        
        //event and body object due to cannon's event-based architecture.
        public onCollide = (e: { body: any }) => {
            var otherImpostor = this._physicsEngine.getImpostorWithPhysicsBody(e.body);
            if (otherImpostor) {
                this._onPhysicsCollideCallbacks.filter((obj) => {
                    return obj.otherImpostors.indexOf(otherImpostor) !== -1
                }).forEach((obj) => {
                    obj.callback(this, otherImpostor);
                })
            }
        }

        /**
         * Apply a force 
         */
        public applyForce(force: Vector3, contactPoint: Vector3) {
            this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
        }

        /**
         * Apply an impulse
         */
        public applyImpulse(force: Vector3, contactPoint: Vector3) {
            this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
        }

        /**
         * A help function to create a joint.
         */
        public createJoint(otherImpostor: PhysicsImpostor, jointType: number, jointData: PhysicsJointData) {
            var joint = new PhysicsJoint(jointType, jointData);
            this.addJoint(otherImpostor, joint);
        }

        /**
         * Add a joint to this impostor with a different impostor.
         */
        public addJoint(otherImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            this._joints.push({
                otherImpostor: otherImpostor,
                joint: joint
            })
            this._physicsEngine.addJoint(this, otherImpostor, joint);
        }
        
        /**
         * Will keep this body still, in a sleep mode.
         */
        public sleep() {
            this._physicsEngine.getPhysicsPlugin().sleepBody(this);
        }
        
        /**
         * Wake the body up.
         */
        public wakeUp() {
            this._physicsEngine.getPhysicsPlugin().wakeUpBody(this);
        }

        public dispose(disposeChildren: boolean = true) {
            this.physicsBody = null;
            if (this.parent) {
                this.parent.forceUpdate();
            } else {
                this.mesh.getChildMeshes().forEach(function (mesh) {
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
            if (!this._deltaRotation) {
                this._deltaRotation = new Quaternion();
            }
            this._deltaRotation.copyFrom(rotation);
            this._deltaRotationConjugated = this._deltaRotation.conjugate();
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