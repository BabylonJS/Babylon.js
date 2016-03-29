﻿module BABYLON {

    export interface PhysicsImpostorJoint {
        mainImpostor: PhysicsImpostor;
        connectedImpostor: PhysicsImpostor;
        joint: PhysicsJoint;
    }

    export class PhysicsEngine {

        public gravity: Vector3;

        constructor(gravity?: Vector3, private _physicsPlugin: IPhysicsEnginePlugin = new CannonJSPlugin()) {
            if (!this._physicsPlugin.isSupported()) {
                throw new Error("Physics Engine " + this._physicsPlugin.name + " cannot be found. "
                    + "Please make sure it is included.")
            }
            gravity = gravity || new Vector3(0, -9.807, 0)
            this.setGravity(gravity);
            this.setTimeStep();
        }

        public setGravity(gravity: Vector3): void {
            this.gravity = gravity;
            this._physicsPlugin.setGravity(this.gravity);
        }
        
        /**
         * Set the time step of the physics engine.
         * default is 1/60. 
         * To slow it down, enter 1/600 for example.
         * To speed it up, 1/30
         * @param {number} newTimeStep the new timestep to apply to this world.
         */
        public setTimeStep(newTimeStep: number = 1 / 60) {
            this._physicsPlugin.setTimeStep(newTimeStep);
        }

        public dispose(): void {
            this._impostors.forEach(function (impostor) {
                impostor.dispose();
            })
            this._physicsPlugin.dispose();
        }

        public getPhysicsPluginName(): string {
            return this._physicsPlugin.name;
        }

        // Statics, Legacy support.
        /**
         * @Deprecated
         *  
         */
        public static NoImpostor = PhysicsImpostor.NoImpostor;
        public static SphereImpostor = PhysicsImpostor.SphereImpostor;
        public static BoxImpostor = PhysicsImpostor.BoxImpostor;
        public static PlaneImpostor = PhysicsImpostor.PlaneImpostor;
        public static MeshImpostor = PhysicsImpostor.MeshImpostor;
        public static CylinderImpostor = PhysicsImpostor.CylinderImpostor;
        public static HeightmapImpostor = PhysicsImpostor.HeightmapImpostor;
        public static CapsuleImpostor = -1;
        public static ConeImpostor = -1;
        public static ConvexHullImpostor = -1;

        public static Epsilon = 0.001;
        
        //new methods and parameters
        
        private _impostors: Array<PhysicsImpostor> = [];
        private _joints: Array<PhysicsImpostorJoint> = [];

        /**
         * Adding a new impostor for the impostor tracking.
         * This will be done by the impostor itself.
         * @param {PhysicsImpostor} impostor the impostor to add
         */
        public addImpostor(impostor: PhysicsImpostor) {
            impostor.uniqueId = this._impostors.push(impostor);
            //if no parent, generate the body
            if (!impostor.parent) {
                this._physicsPlugin.generatePhysicsBody(impostor);
            }
        }

        /**
         * Remove an impostor from the engine.
         * This impostor and its mesh will not longer be updated by the physics engine.
         * @param {PhysicsImpostor} impostor the impostor to remove
         */
        public removeImpostor(impostor: PhysicsImpostor) {
            var index = this._impostors.indexOf(impostor);
            if (index > -1) {
                var removed = this._impostors.splice(index, 1);
                //Is it needed?
                if (removed.length) {
                    //this will also remove it from the world.
                    removed[0].physicsBody = null;
                }
            }
        }
        
        /**
         * Add a joint to the physics engine
         * @param {PhysicsImpostor} mainImpostor the main impostor to which the joint is added.
         * @param {PhysicsImpostor} connectedImpostor the impostor that is connected to the main impostor using this joint
         * @param {PhysicsJoint} the joint that will connect both impostors.
         */
        public addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            var impostorJoint = {
                mainImpostor: mainImpostor,
                connectedImpostor: connectedImpostor,
                joint: joint
            }
            joint.physicsPlugin = this._physicsPlugin;
            this._joints.push(impostorJoint);
            this._physicsPlugin.generateJoint(impostorJoint);
        }

        public removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            var matchingJoints = this._joints.filter(function (impostorJoint) {
                return (impostorJoint.connectedImpostor === connectedImpostor
                    && impostorJoint.joint === joint
                    && impostorJoint.mainImpostor === mainImpostor)
            });
            if (matchingJoints.length) {
                this._physicsPlugin.removeJoint(matchingJoints[0]);
                //TODO remove it from the list as well
                
            }
        }

        /**
         * Called by the scene. no need to call it.
         */
        public _step(delta: number) {
            //check if any mesh has no body / requires an update
            this._impostors.forEach((impostor) => {

                if (impostor.isBodyInitRequired()) {
                    this._physicsPlugin.generatePhysicsBody(impostor);
                }
            });

            if (delta > 0.1) {
                delta = 0.1;
            } else if (delta <= 0) {
                delta = 1.0 / 60.0;
            }

            this._physicsPlugin.executeStep(delta, this._impostors);
        }

        public getPhysicsPlugin(): IPhysicsEnginePlugin {
            return this._physicsPlugin;
        }
        
        public getImpostorForPhysicsObject(object: IPhysicsEnabledObject) {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].object === object) {
                    return this._impostors[i];
                }
            }
        }

        public getImpostorWithPhysicsBody(body: any): PhysicsImpostor {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].physicsBody === body) {
                    return this._impostors[i];
                }
            }
        }
    }

    export interface IPhysicsEnginePlugin {
        world: any;
        name: string;
        setGravity(gravity: Vector3);
        setTimeStep(timeStep: number);
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void; //not forgetting pre and post events
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3);
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3);
        generatePhysicsBody(impostor: PhysicsImpostor);
        removePhysicsBody(impostor: PhysicsImpostor);
        generateJoint(joint: PhysicsImpostorJoint);
        removeJoint(joint: PhysicsImpostorJoint)
        isSupported(): boolean;
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor);
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion);
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3);
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3);
        getLinearVelocity(impostor: PhysicsImpostor) : Vector3;
        getAngularVelocity(impostor: PhysicsImpostor) : Vector3;
        setBodyMass(impostor: PhysicsImpostor, mass: number);
        sleepBody(impostor: PhysicsImpostor);
        wakeUpBody(impostor: PhysicsImpostor);
        //Joint Update
        updateDistanceJoint(joint: DistanceJoint, maxDistance:number, minDistance?: number);
        setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number);
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number);
        dispose();
    }
}