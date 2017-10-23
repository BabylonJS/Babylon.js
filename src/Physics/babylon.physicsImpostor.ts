module BABYLON {

    export interface PhysicsImpostorParameters {
        mass: number;
        friction?: number;
        restitution?: number;
        nativeOptions?: any;
    }

    export interface IPhysicsEnabledObject {
        position: Vector3;
        rotationQuaternion: Nullable<Quaternion>;
        scaling: Vector3;
        rotation?: Vector3;
        parent?: any;
        getBoundingInfo(): Nullable<BoundingInfo>;
        computeWorldMatrix?(force: boolean): void;
        getWorldMatrix?(): Matrix;
        getChildMeshes?(directDescendantsOnly?: boolean): Array<AbstractMesh>;
        getVerticesData?(kind: string): Nullable<Array<number> | Float32Array>;
        getIndices?(): Nullable<IndicesArray>;
        getScene?(): Scene;
        getAbsolutePosition(): Vector3;
    }

    export class PhysicsImpostor {

        public static DEFAULT_OBJECT_SIZE: Vector3 = new BABYLON.Vector3(1, 1, 1);

        public static IDENTITY_QUATERNION = Quaternion.Identity();

        private _physicsEngine: Nullable<PhysicsEngine>;
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

        private _isDisposed = false;

        private static _tmpVecs: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
        private static _tmpQuat: Quaternion = Quaternion.Identity();

        get isDisposed(): boolean {
            return this._isDisposed;
        }

        get mass(): number {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyMass(this) : 0;
        }

        set mass(value: number) {
            this.setMass(value);
        }

        get friction(): number {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyFriction(this) : 0;
        }

        set friction(value: number) {
            if (!this._physicsEngine) {
                return;
            }
            this._physicsEngine.getPhysicsPlugin().setBodyFriction(this, value);
        }

        get restitution(): number {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyRestitution(this) : 0;
        }

        set restitution(value: number) {
            if (!this._physicsEngine) {
                return;
            }            
            this._physicsEngine.getPhysicsPlugin().setBodyRestitution(this, value);
        }

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

            if (!this._scene) {
                return;
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
                } else if (this.object.parent.physicsImpostor) {
                    Tools.Warn("You must affect impostors to children before affecting impostor to parent.");
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
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine.removeImpostor(this);
            this.physicsBody = null;
            this._parent = this._parent || this._getPhysicsParent();
            if (!this.parent) {
                this._physicsEngine.addImpostor(this);
            }
        }

        private _getPhysicsParent(): Nullable<PhysicsImpostor> {
            if (this.object.parent instanceof AbstractMesh) {
                var parentMesh: AbstractMesh = <AbstractMesh>this.object.parent;
                return parentMesh.physicsImpostor;
            }
            return null;
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

        public get parent(): PhysicsImpostor {
            return this._parent;
        }

        public set parent(value: PhysicsImpostor) {
            this._parent = value;
        }

        /**
         * Set the physics body. Used mainly by the physics engine/plugin
         */
        public set physicsBody(physicsBody: any) {
            if (this._physicsBody && this._physicsEngine) {
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
                let q = this.object.rotationQuaternion;
                //reset rotation
                this.object.rotationQuaternion = PhysicsImpostor.IDENTITY_QUATERNION;
                //calculate the world matrix with no rotation
                this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
                let boundingInfo = this.object.getBoundingInfo();
                let size: Vector3;
                if (boundingInfo) {
                    size = boundingInfo.boundingBox.extendSizeWorld.scale(2)
                } else {
                    size = Vector3.Zero();
                }

                //bring back the rotation
                this.object.rotationQuaternion = q;
                //calculate the world matrix with the new rotation
                this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);

                return size;
            } else {
                return PhysicsImpostor.DEFAULT_OBJECT_SIZE;
            }
        }

        public getObjectCenter(): Vector3 {
            if (this.object.getBoundingInfo) {
                let boundingInfo = this.object.getBoundingInfo();
                if (!boundingInfo) {
                    return this.object.position;
                }
                return boundingInfo.boundingBox.centerWorld;
            } else {
                return this.object.position;
            }
        }

        /**
         * Get a specific parametes from the options parameter.
         */
        public getParam(paramName: string) {
            return (<any>this._options)[paramName];
        }

        /**
         * Sets a specific parameter in the options given to the physics plugin
         */
        public setParam(paramName: string, value: number) {
            (<any>this._options)[paramName] = value;
            this._bodyUpdateRequired = true;
        }

        /**
         * Specifically change the body's mass option. Won't recreate the physics body object
         */
        public setMass(mass: number) {
            if (this.getParam("mass") !== mass) {
                this.setParam("mass", mass);
            }
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().setBodyMass(this, mass);
            }
        }

        public getLinearVelocity(): Vector3 {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this) : Vector3.Zero();
        }

        public setLinearVelocity(velocity: Vector3) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
            }
        }

        public getAngularVelocity(): Vector3 {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this) : Vector3.Zero();
        }

        public setAngularVelocity(velocity: Vector3) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, velocity);
            }
        }

        /**
         * Execute a function with the physics plugin native code.
         * Provide a function the will have two variables - the world object and the physics body object.
         */
        public executeNativeFunction(func: (world: any, physicsBody: any) => void) {
            if (this._physicsEngine) {
                func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
            }
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
            if (!this._physicsEngine) {
                return;
            }
            this.object.position.subtractToRef(this._deltaPosition, this._tmpPositionWithDelta);
            //conjugate deltaRotation
            if (this.object.rotationQuaternion) {
                if (this._deltaRotationConjugated) {
                    this.object.rotationQuaternion.multiplyToRef(this._deltaRotationConjugated, this._tmpRotationWithDelta);
                } else {
                    this._tmpRotationWithDelta.copyFrom(this.object.rotationQuaternion);
                }
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
            if (!this._physicsEngine) {
                return;
            }

            this._onAfterPhysicsStepCallbacks.forEach((func) => {
                func(this);
            });

            this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(this);

            this.object.position.addInPlace(this._deltaPosition)
            if (this._deltaRotation && this.object.rotationQuaternion) {
                this.object.rotationQuaternion.multiplyInPlace(this._deltaRotation);
            }
        }

        /**
         * Legacy collision detection event support
         */
        public onCollideEvent: Nullable<(collider: BABYLON.PhysicsImpostor, collidedWith: BABYLON.PhysicsImpostor) => void> = null;

        //event and body object due to cannon's event-based architecture.
        public onCollide = (e: { body: any }) => {
            if (!this._onPhysicsCollideCallbacks.length && !this.onCollideEvent) {
                return;
            }

            if (!this._physicsEngine) {
                return;

            }
            var otherImpostor = this._physicsEngine.getImpostorWithPhysicsBody(e.body);
            if (otherImpostor) {
                // Legacy collision detection event support
                if (this.onCollideEvent) {
                    this.onCollideEvent(this, otherImpostor);
                }
                this._onPhysicsCollideCallbacks.filter((obj) => {
                    return obj.otherImpostors.indexOf((<PhysicsImpostor>otherImpostor)) !== -1
                }).forEach((obj) => {
                    obj.callback(this, <PhysicsImpostor>otherImpostor);
                })
            }
        }

        /**
         * Apply a force 
         */
        public applyForce(force: Vector3, contactPoint: Vector3): PhysicsImpostor {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
            }
            return this;
        }

        /**
         * Apply an impulse
         */
        public applyImpulse(force: Vector3, contactPoint: Vector3): PhysicsImpostor {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
            }

            return this;
        }

        /**
         * A help function to create a joint.
         */
        public createJoint(otherImpostor: PhysicsImpostor, jointType: number, jointData: PhysicsJointData): PhysicsImpostor {
            var joint = new PhysicsJoint(jointType, jointData);
            this.addJoint(otherImpostor, joint);

            return this;
        }

        /**
         * Add a joint to this impostor with a different impostor.
         */
        public addJoint(otherImpostor: PhysicsImpostor, joint: PhysicsJoint): PhysicsImpostor {
            this._joints.push({
                otherImpostor: otherImpostor,
                joint: joint
            });

            if (this._physicsEngine) {
                this._physicsEngine.addJoint(this, otherImpostor, joint);
            }

            return this;
        }

        /**
         * Will keep this body still, in a sleep mode.
         */
        public sleep(): PhysicsImpostor {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().sleepBody(this);
            }

            return this;
        }

        /**
         * Wake the body up.
         */
        public wakeUp(): PhysicsImpostor {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().wakeUpBody(this);
            }

            return this;
        }

        public clone(newObject: IPhysicsEnabledObject): Nullable<PhysicsImpostor> {
            if (!newObject) return null;
            return new PhysicsImpostor(newObject, this.type, this._options, this._scene);
        }

        public dispose(/*disposeChildren: boolean = true*/) {
            //no dispose if no physics engine is available.
            if (!this._physicsEngine) {
                return;
            }

            this._joints.forEach((j) => {
                if (this._physicsEngine) {
                    this._physicsEngine.removeJoint(this, j.otherImpostor, j.joint);
                }
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

            this._isDisposed = true;
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

        public getBoxSizeToRef(result: Vector3): PhysicsImpostor {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().getBoxSizeToRef(this, result);
            }

            return this;
        }

        public getRadius(): number {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getRadius(this) : 0;
        }

        /**
         * Sync a bone with this impostor
         * @param bone The bone to sync to the impostor.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         */
        public syncBoneWithImpostor(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion) {

            var tempVec = PhysicsImpostor._tmpVecs[0];
            var mesh = <AbstractMesh>this.object;

            if (mesh.rotationQuaternion) {
                if (adjustRotation) {
                    var tempQuat = PhysicsImpostor._tmpQuat;
                    mesh.rotationQuaternion.multiplyToRef(adjustRotation, tempQuat);
                    bone.setRotationQuaternion(tempQuat, Space.WORLD, boneMesh);
                } else {
                    bone.setRotationQuaternion(mesh.rotationQuaternion, Space.WORLD, boneMesh);
                }
            }

            tempVec.x = 0;
            tempVec.y = 0;
            tempVec.z = 0;

            if (jointPivot) {
                tempVec.x = jointPivot.x;
                tempVec.y = jointPivot.y;
                tempVec.z = jointPivot.z;

                bone.getDirectionToRef(tempVec, boneMesh, tempVec);

                if (distToJoint === undefined || distToJoint === null) {
                    distToJoint = jointPivot.length();
                }

                tempVec.x *= distToJoint;
                tempVec.y *= distToJoint;
                tempVec.z *= distToJoint;
            }

            if (bone.getParent()) {
                tempVec.addInPlace(mesh.getAbsolutePosition());
                bone.setAbsolutePosition(tempVec, boneMesh);
            } else {
                boneMesh.setAbsolutePosition(mesh.getAbsolutePosition());
                boneMesh.position.x -= tempVec.x;
                boneMesh.position.y -= tempVec.y;
                boneMesh.position.z -= tempVec.z;
            }

        }

        /**
         * Sync impostor to a bone
         * @param bone The bone that the impostor will be synced to.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         * @param boneAxis Optional vector3 axis the bone is aligned with
         */
        public syncImpostorWithBone(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion, boneAxis?: Vector3) {

            var mesh = <AbstractMesh>this.object;

            if (mesh.rotationQuaternion) {
                if (adjustRotation) {
                    var tempQuat = PhysicsImpostor._tmpQuat;
                    bone.getRotationQuaternionToRef(Space.WORLD, boneMesh, tempQuat);
                    tempQuat.multiplyToRef(adjustRotation, mesh.rotationQuaternion);
                } else {
                    bone.getRotationQuaternionToRef(Space.WORLD, boneMesh, mesh.rotationQuaternion);
                }
            }

            var pos = PhysicsImpostor._tmpVecs[0];
            var boneDir = PhysicsImpostor._tmpVecs[1];

            if (!boneAxis) {
                boneAxis = PhysicsImpostor._tmpVecs[2];
                boneAxis.x = 0;
                boneAxis.y = 1;
                boneAxis.z = 0;
            }

            bone.getDirectionToRef(boneAxis, boneMesh, boneDir);
            bone.getAbsolutePositionToRef(boneMesh, pos);

            if ((distToJoint === undefined || distToJoint === null) && jointPivot) {
                distToJoint = jointPivot.length();
            }

            if (distToJoint !== undefined && distToJoint !== null) {
                pos.x += boneDir.x * distToJoint;
                pos.y += boneDir.y * distToJoint;
                pos.z += boneDir.z * distToJoint;
            }

            mesh.setAbsolutePosition(pos);

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
