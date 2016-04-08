module BABYLON {

    export interface PhysicsImpostorParameters {
        mass: number;
        friction?: number;
        restitution?: number;
        nativeOptions?: any;
    }

    export interface IPhysicsEnabledObject {
        position: Vector3;
        rotationQuaternion: Quaternion;
        scaling: Vector3;
        rotation?: Vector3;
        parent?: any;
        getBoundingInfo?(): BoundingInfo;
        computeWorldMatrix?(force: boolean): void;
        getChildMeshes?(): Array<AbstractMesh>;
        getVerticesData?(kind: string): Array<number> | Float32Array;
        getIndices?(): Array<number> | Int32Array;
        getScene?(): Scene;
    }

    export class PhysicsImpostor {

        public static DEFAULT_OBJECT_SIZE: Vector3 = new BABYLON.Vector3(1, 1, 1);

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

        //set by the physics engine when adding this impostor to the array.
        public uniqueId: number;

        private _joints: Array<{
            joint: PhysicsJoint,
            otherImpostor: PhysicsImpostor
        }>;

        constructor(public object: IPhysicsEnabledObject, public type: number, private _options: PhysicsImpostorParameters = { mass: 0 }, private _scene?: Scene) {

            //sanity check!
            if (!this.object) {
                Tools.Error("No object was provided. A physics object is obligatory");
                return;
            }

            //legacy support for old syntax.
            if (!this._scene && object.getScene) {
                this._scene = object.getScene()
            }

            this._physicsEngine = this._scene.getPhysicsEngine();
            if (!this._physicsEngine) {
                Tools.Error("Physics not enabled. Please use scene.enablePhysics(...) before creating impostors.")
            } else {
                //set the object's quaternion, if not set
                if (!this.object.rotationQuaternion) {
                    if (this.object.rotation) {
                        this.object.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.object.rotation.y, this.object.rotation.x, this.object.rotation.z);
                    } else {
                        this.object.rotationQuaternion = new Quaternion();
                    }

                }
                //default options params
                this._options.mass = (_options.mass === void 0) ? 0 : _options.mass
                this._options.friction = (_options.friction === void 0) ? 0.2 : _options.friction
                this._options.restitution = (_options.restitution === void 0) ? 0.2 : _options.restitution
                this._joints = [];
                //If the mesh has a parent, don't initialize the physicsBody. Instead wait for the parent to do that.
                if (!this.object.parent) {
                    this._init();
                }
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
            if (this.object.parent instanceof AbstractMesh) {
                var parentMesh: AbstractMesh = <AbstractMesh>this.object.parent;
                return parentMesh.physicsImpostor;
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

        /*public get mesh(): AbstractMesh {
            return this._mesh;
        }*/

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

        public getObjectExtendSize(): Vector3 {
            if (this.object.getBoundingInfo) {
                this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
                return this.object.getBoundingInfo().boundingBox.extendSize.scale(2).multiply(this.object.scaling)
            } else {
                return PhysicsImpostor.DEFAULT_OBJECT_SIZE;
            }
        }

        public getObjectCenter(): Vector3 {
            if (this.object.getBoundingInfo) {
                return this.object.getBoundingInfo().boundingBox.center;
            } else {
                return this.object.position;
            }
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
         * Specifically change the body's mass option. Won't recreate the physics body object
         */
        public setMass(mass: number) {
            if (this.getParam("mass") !== mass) {
                this.setParam("mass", mass);
            }
            this._physicsEngine.getPhysicsPlugin().setBodyMass(this, mass);
        }

        public getLinearVelocity(): Vector3 {
            return this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this);
        }

        /**
         * Set the body's linear velocity.
         */
        public setLinearVelocity(velocity: Vector3) {
            this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
        }

        public getAngularVelocity(): Vector3 {
            return this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this);
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

            this.object.position.subtractToRef(this._deltaPosition, this._tmpPositionWithDelta);
            //conjugate deltaRotation
            if (this._deltaRotationConjugated) {
                this.object.rotationQuaternion.multiplyToRef(this._deltaRotationConjugated, this._tmpRotationWithDelta);
            } else {
                this._tmpRotationWithDelta.copyFrom(this.object.rotationQuaternion);
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

            this.object.position.addInPlace(this._deltaPosition)
            if (this._deltaRotation) {
                this.object.rotationQuaternion.multiplyInPlace(this._deltaRotation);
            }
        }

        //event and body object due to cannon's event-based architecture.
        public onCollide = (e: { body: any }) => {
            if(!this._onPhysicsCollideCallbacks.length) return;
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

        public clone(newObject: IPhysicsEnabledObject) {
            if (!newObject) return null;
            return new PhysicsImpostor(newObject, this.type, this._options, this._scene);
        }

        public dispose(/*disposeChildren: boolean = true*/) {
            this._joints.forEach((j) => {
                this._physicsEngine.removeJoint(this, j.otherImpostor, j.joint);
            })
            //dispose the physics body
            this._physicsEngine.removeImpostor(this);
            if (this.parent) {
                this.parent.forceUpdate();
            } else {
                /*this._object.getChildMeshes().forEach(function(mesh) {
                    if (mesh.physicsImpostor) {
                        if (disposeChildren) {
                            mesh.physicsImpostor.dispose();
                            mesh.physicsImpostor = null;
                        }
                    }
                })*/
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
        public static CylinderImpostor = 7;
        public static ParticleImpostor = 8;
        public static HeightmapImpostor = 9;
    }
}

