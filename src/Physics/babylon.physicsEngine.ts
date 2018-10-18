module BABYLON {

    /**
     * Class used to control physics engine
     * @see http://doc.babylonjs.com/how_to/using_the_physics_engine
     */
    export class PhysicsEngine implements IPhysicsEngine {
        /**
         * Global value used to control the smallest number supported by the simulation
         */
        public static Epsilon = 0.001;

        private _impostors: Array<PhysicsImpostor> = [];
        private _joints: Array<PhysicsImpostorJoint> = [];

        /**
         * Gets the gravity vector used by the simulation
         */
        public gravity: Vector3;

        /**
         * Creates a new Physics Engine
         * @param gravity defines the gravity vector used by the simulation
         * @param _physicsPlugin defines the plugin to use (CannonJS by default)
         */
        constructor(gravity: Nullable<Vector3>, private _physicsPlugin: IPhysicsEnginePlugin = new CannonJSPlugin()) {
            if (!this._physicsPlugin.isSupported()) {
                throw new Error("Physics Engine " + this._physicsPlugin.name + " cannot be found. "
                    + "Please make sure it is included.");
            }
            gravity = gravity || new Vector3(0, -9.807, 0);
            this.setGravity(gravity);
            this.setTimeStep();
        }

        /**
         * Sets the gravity vector used by the simulation
         * @param gravity defines the gravity vector to use
         */
        public setGravity(gravity: Vector3): void {
            this.gravity = gravity;
            this._physicsPlugin.setGravity(this.gravity);
        }

        /**
         * Set the time step of the physics engine.
         * Default is 1/60.
         * To slow it down, enter 1/600 for example.
         * To speed it up, 1/30
         * @param newTimeStep defines the new timestep to apply to this world.
         */
        public setTimeStep(newTimeStep: number = 1 / 60) {
            this._physicsPlugin.setTimeStep(newTimeStep);
        }

        /**
         * Get the time step of the physics engine.
         * @returns the current time step
         */
        public getTimeStep(): number {
            return this._physicsPlugin.getTimeStep();
        }

        /**
         * Release all resources
         */
        public dispose(): void {
            this._impostors.forEach(function(impostor) {
                impostor.dispose();
            });
            this._physicsPlugin.dispose();
        }

        /**
         * Gets the name of the current physics plugin
         * @returns the name of the plugin
         */
        public getPhysicsPluginName(): string {
            return this._physicsPlugin.name;
        }

        /**
         * Adding a new impostor for the impostor tracking.
         * This will be done by the impostor itself.
         * @param impostor the impostor to add
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
         * @param impostor the impostor to remove
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
         * @param mainImpostor defines the main impostor to which the joint is added.
         * @param connectedImpostor defines the impostor that is connected to the main impostor using this joint
         * @param joint defines the joint that will connect both impostors.
         */
        public addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            var impostorJoint = {
                mainImpostor: mainImpostor,
                connectedImpostor: connectedImpostor,
                joint: joint
            };
            joint.physicsPlugin = this._physicsPlugin;
            this._joints.push(impostorJoint);
            this._physicsPlugin.generateJoint(impostorJoint);
        }

        /**
         * Removes a joint from the simulation
         * @param mainImpostor defines the impostor used with the joint
         * @param connectedImpostor defines the other impostor connected to the main one by the joint
         * @param joint defines the joint to remove
         */
        public removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            var matchingJoints = this._joints.filter(function(impostorJoint) {
                return (impostorJoint.connectedImpostor === connectedImpostor
                    && impostorJoint.joint === joint
                    && impostorJoint.mainImpostor === mainImpostor);
            });
            if (matchingJoints.length) {
                this._physicsPlugin.removeJoint(matchingJoints[0]);
                //TODO remove it from the list as well

            }
        }

        /**
         * Called by the scene. No need to call it.
         * @param delta defines the timespam between frames
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

        /**
         * Gets the current plugin used to run the simulation
         * @returns current plugin
         */
        public getPhysicsPlugin(): IPhysicsEnginePlugin {
            return this._physicsPlugin;
        }

        /**
         * Gets the list of physic impostors
         * @returns an array of PhysicsImpostor
         */
        public getImpostors(): Array<PhysicsImpostor> {
            return this._impostors;
        }

        /**
         * Gets the impostor for a physics enabled object
         * @param object defines the object impersonated by the impostor
         * @returns the PhysicsImpostor or null if not found
         */
        public getImpostorForPhysicsObject(object: IPhysicsEnabledObject): Nullable<PhysicsImpostor> {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].object === object) {
                    return this._impostors[i];
                }
            }

            return null;
        }

        /**
         * Gets the impostor for a physics body object
         * @param body defines physics body used by the impostor
         * @returns the PhysicsImpostor or null if not found
         */
        public getImpostorWithPhysicsBody(body: any): Nullable<PhysicsImpostor> {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].physicsBody === body) {
                    return this._impostors[i];
                }
            }

            return null;
        }
    }
}
