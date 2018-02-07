declare module 'babylonjs/physics' {
    interface PhysicsJointData {
        mainPivot?: Vector3;
        connectedPivot?: Vector3;
        mainAxis?: Vector3;
        connectedAxis?: Vector3;
        collision?: boolean;
        nativeParams?: any;
    }
    /**
     * This is a holder class for the physics joint created by the physics plugin.
     * It holds a set of functions to control the underlying joint.
     */
    class PhysicsJoint {
        type: number;
        jointData: PhysicsJointData;
        private _physicsJoint;
        protected _physicsPlugin: IPhysicsEnginePlugin;
        constructor(type: number, jointData: PhysicsJointData);
        physicsJoint: any;
        physicsPlugin: IPhysicsEnginePlugin;
        /**
         * Execute a function that is physics-plugin specific.
         * @param {Function} func the function that will be executed.
         *                        It accepts two parameters: the physics world and the physics joint.
         */
        executeNativeFunction(func: (world: any, physicsJoint: any) => void): void;
        static DistanceJoint: number;
        static HingeJoint: number;
        static BallAndSocketJoint: number;
        static WheelJoint: number;
        static SliderJoint: number;
        static PrismaticJoint: number;
        static UniversalJoint: number;
        static Hinge2Joint: number;
        static PointToPointJoint: number;
        static SpringJoint: number;
        static LockJoint: number;
    }
    /**
     * A class representing a physics distance joint.
     */
    class DistanceJoint extends PhysicsJoint {
        constructor(jointData: DistanceJointData);
        /**
         * Update the predefined distance.
         */
        updateDistance(maxDistance: number, minDistance?: number): void;
    }
    class MotorEnabledJoint extends PhysicsJoint implements IMotorEnabledJoint {
        constructor(type: number, jointData: PhysicsJointData);
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        setMotor(force?: number, maxForce?: number): void;
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        setLimit(upperLimit: number, lowerLimit?: number): void;
    }
    /**
     * This class represents a single hinge physics joint
     */
    class HingeJoint extends MotorEnabledJoint {
        constructor(jointData: PhysicsJointData);
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        setMotor(force?: number, maxForce?: number): void;
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        setLimit(upperLimit: number, lowerLimit?: number): void;
    }
    /**
     * This class represents a dual hinge physics joint (same as wheel joint)
     */
    class Hinge2Joint extends MotorEnabledJoint {
        constructor(jointData: PhysicsJointData);
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        setMotor(force?: number, maxForce?: number, motorIndex?: number): void;
        /**
         * Set the motor limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} upperLimit the upper limit
         * @param {number} lowerLimit lower limit
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        setLimit(upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
    }
    interface IMotorEnabledJoint {
        physicsJoint: any;
        setMotor(force?: number, maxForce?: number, motorIndex?: number): void;
        setLimit(upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
    }
    interface DistanceJointData extends PhysicsJointData {
        maxDistance: number;
    }
    interface SpringJointData extends PhysicsJointData {
        length: number;
        stiffness: number;
        damping: number;
    }
}

declare module 'babylonjs/physics' {
    interface PhysicsImpostorParameters {
        mass: number;
        friction?: number;
        restitution?: number;
        nativeOptions?: any;
        ignoreParent?: boolean;
        disableBidirectionalTransformation?: boolean;
    }
    interface IPhysicsEnabledObject {
        position: Vector3;
        rotationQuaternion: Nullable<Quaternion>;
        scaling: Vector3;
        rotation?: Vector3;
        parent?: any;
        getBoundingInfo(): BoundingInfo;
        computeWorldMatrix(force: boolean): Matrix;
        getWorldMatrix?(): Matrix;
        getChildMeshes?(directDescendantsOnly?: boolean): Array<AbstractMesh>;
        getVerticesData(kind: string): Nullable<Array<number> | Float32Array>;
        getIndices?(): Nullable<IndicesArray>;
        getScene?(): Scene;
        getAbsolutePosition(): Vector3;
        getAbsolutePivotPoint(): Vector3;
        rotate(axis: Vector3, amount: number, space?: Space): TransformNode;
        translate(axis: Vector3, distance: number, space?: Space): TransformNode;
        setAbsolutePosition(absolutePosition: Vector3): TransformNode;
        getClassName(): string;
    }
    class PhysicsImpostor {
        object: IPhysicsEnabledObject;
        type: number;
        private _options;
        private _scene;
        static DEFAULT_OBJECT_SIZE: Vector3;
        static IDENTITY_QUATERNION: Quaternion;
        private _physicsEngine;
        private _physicsBody;
        private _bodyUpdateRequired;
        private _onBeforePhysicsStepCallbacks;
        private _onAfterPhysicsStepCallbacks;
        private _onPhysicsCollideCallbacks;
        private _deltaPosition;
        private _deltaRotation;
        private _deltaRotationConjugated;
        private _parent;
        private _isDisposed;
        private static _tmpVecs;
        private static _tmpQuat;
        readonly isDisposed: boolean;
        mass: number;
        friction: number;
        restitution: number;
        uniqueId: number;
        private _joints;
        constructor(object: IPhysicsEnabledObject, type: number, _options?: PhysicsImpostorParameters, _scene?: Scene | undefined);
        /**
         * This function will completly initialize this impostor.
         * It will create a new body - but only if this mesh has no parent.
         * If it has, this impostor will not be used other than to define the impostor
         * of the child mesh.
         */
        _init(): void;
        private _getPhysicsParent();
        /**
         * Should a new body be generated.
         */
        isBodyInitRequired(): boolean;
        setScalingUpdated(updated: boolean): void;
        /**
         * Force a regeneration of this or the parent's impostor's body.
         * Use under cautious - This will remove all joints already implemented.
         */
        forceUpdate(): void;
        /**
         * Gets the body that holds this impostor. Either its own, or its parent.
         */
        /**
         * Set the physics body. Used mainly by the physics engine/plugin
         */
        physicsBody: any;
        parent: Nullable<PhysicsImpostor>;
        resetUpdateFlags(): void;
        getObjectExtendSize(): Vector3;
        getObjectCenter(): Vector3;
        /**
         * Get a specific parametes from the options parameter.
         */
        getParam(paramName: string): any;
        /**
         * Sets a specific parameter in the options given to the physics plugin
         */
        setParam(paramName: string, value: number): void;
        /**
         * Specifically change the body's mass option. Won't recreate the physics body object
         */
        setMass(mass: number): void;
        getLinearVelocity(): Nullable<Vector3>;
        setLinearVelocity(velocity: Nullable<Vector3>): void;
        getAngularVelocity(): Nullable<Vector3>;
        setAngularVelocity(velocity: Nullable<Vector3>): void;
        /**
         * Execute a function with the physics plugin native code.
         * Provide a function the will have two variables - the world object and the physics body object.
         */
        executeNativeFunction(func: (world: any, physicsBody: any) => void): void;
        /**
         * Register a function that will be executed before the physics world is stepping forward.
         */
        registerBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        unregisterBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        /**
         * Register a function that will be executed after the physics step
         */
        registerAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        unregisterAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        /**
         * register a function that will be executed when this impostor collides against a different body.
         */
        registerOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void): void;
        unregisterOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor | Array<PhysicsImpostor>) => void): void;
        private _tmpQuat;
        private _tmpQuat2;
        getParentsRotation(): Quaternion;
        /**
         * this function is executed by the physics engine.
         */
        beforeStep: () => void;
        /**
         * this function is executed by the physics engine.
         */
        afterStep: () => void;
        /**
         * Legacy collision detection event support
         */
        onCollideEvent: Nullable<(collider: PhysicsImpostor, collidedWith: PhysicsImpostor) => void>;
        onCollide: (e: {
            body: any;
        }) => void;
        /**
         * Apply a force
         */
        applyForce(force: Vector3, contactPoint: Vector3): PhysicsImpostor;
        /**
         * Apply an impulse
         */
        applyImpulse(force: Vector3, contactPoint: Vector3): PhysicsImpostor;
        /**
         * A help function to create a joint.
         */
        createJoint(otherImpostor: PhysicsImpostor, jointType: number, jointData: PhysicsJointData): PhysicsImpostor;
        /**
         * Add a joint to this impostor with a different impostor.
         */
        addJoint(otherImpostor: PhysicsImpostor, joint: PhysicsJoint): PhysicsImpostor;
        /**
         * Will keep this body still, in a sleep mode.
         */
        sleep(): PhysicsImpostor;
        /**
         * Wake the body up.
         */
        wakeUp(): PhysicsImpostor;
        clone(newObject: IPhysicsEnabledObject): Nullable<PhysicsImpostor>;
        dispose(): void;
        setDeltaPosition(position: Vector3): void;
        setDeltaRotation(rotation: Quaternion): void;
        getBoxSizeToRef(result: Vector3): PhysicsImpostor;
        getRadius(): number;
        /**
         * Sync a bone with this impostor
         * @param bone The bone to sync to the impostor.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         */
        syncBoneWithImpostor(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion): void;
        /**
         * Sync impostor to a bone
         * @param bone The bone that the impostor will be synced to.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         * @param boneAxis Optional vector3 axis the bone is aligned with
         */
        syncImpostorWithBone(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion, boneAxis?: Vector3): void;
        static NoImpostor: number;
        static SphereImpostor: number;
        static BoxImpostor: number;
        static PlaneImpostor: number;
        static MeshImpostor: number;
        static CylinderImpostor: number;
        static ParticleImpostor: number;
        static HeightmapImpostor: number;
    }
}

declare module 'babylonjs/physics' {
    interface PhysicsImpostorJoint {
        mainImpostor: PhysicsImpostor;
        connectedImpostor: PhysicsImpostor;
        joint: PhysicsJoint;
    }
    class PhysicsEngine {
        private _physicsPlugin;
        gravity: Vector3;
        constructor(gravity: Nullable<Vector3>, _physicsPlugin?: IPhysicsEnginePlugin);
        setGravity(gravity: Vector3): void;
        /**
         * Set the time step of the physics engine.
         * default is 1/60.
         * To slow it down, enter 1/600 for example.
         * To speed it up, 1/30
         * @param {number} newTimeStep the new timestep to apply to this world.
         */
        setTimeStep(newTimeStep?: number): void;
        /**
         * Get the time step of the physics engine.
         */
        getTimeStep(): number;
        dispose(): void;
        getPhysicsPluginName(): string;
        static Epsilon: number;
        private _impostors;
        private _joints;
        /**
         * Adding a new impostor for the impostor tracking.
         * This will be done by the impostor itself.
         * @param {PhysicsImpostor} impostor the impostor to add
         */
        addImpostor(impostor: PhysicsImpostor): void;
        /**
         * Remove an impostor from the engine.
         * This impostor and its mesh will not longer be updated by the physics engine.
         * @param {PhysicsImpostor} impostor the impostor to remove
         */
        removeImpostor(impostor: PhysicsImpostor): void;
        /**
         * Add a joint to the physics engine
         * @param {PhysicsImpostor} mainImpostor the main impostor to which the joint is added.
         * @param {PhysicsImpostor} connectedImpostor the impostor that is connected to the main impostor using this joint
         * @param {PhysicsJoint} the joint that will connect both impostors.
         */
        addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;
        removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;
        /**
         * Called by the scene. no need to call it.
         */
        _step(delta: number): void;
        getPhysicsPlugin(): IPhysicsEnginePlugin;
        getImpostors(): Array<PhysicsImpostor>;
        getImpostorForPhysicsObject(object: IPhysicsEnabledObject): Nullable<PhysicsImpostor>;
        getImpostorWithPhysicsBody(body: any): Nullable<PhysicsImpostor>;
    }
    interface IPhysicsEnginePlugin {
        world: any;
        name: string;
        setGravity(gravity: Vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void;
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(joint: PhysicsImpostorJoint): void;
        removeJoint(joint: PhysicsImpostorJoint): void;
        isSupported(): boolean;
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Nullable<Vector3>): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Nullable<Vector3>): void;
        getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        wakeUpBody(impostor: PhysicsImpostor): void;
        updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
        getRadius(impostor: PhysicsImpostor): number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
        syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
        dispose(): void;
    }
}

declare module 'babylonjs/physics' {
    class PhysicsHelper {
        private _scene;
        private _physicsEngine;
        constructor(scene: Scene);
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        applyRadialExplosionImpulse(origin: Vector3, radius: number, strength: number, falloff?: PhysicsRadialImpulseFalloff): Nullable<PhysicsRadialExplosionEvent>;
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        applyRadialExplosionForce(origin: Vector3, radius: number, strength: number, falloff?: PhysicsRadialImpulseFalloff): Nullable<PhysicsRadialExplosionEvent>;
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        gravitationalField(origin: Vector3, radius: number, strength: number, falloff?: PhysicsRadialImpulseFalloff): Nullable<PhysicsGravitationalFieldEvent>;
        /**
         * @param {Vector3} origin the origin of the updraft
         * @param {number} radius the radius of the updraft
         * @param {number} strength the strength of the updraft
         * @param {number} height the height of the updraft
         * @param {PhysicsUpdraftMode} updraftMode possible options: Center & Perpendicular. Defaults to Center
         */
        updraft(origin: Vector3, radius: number, strength: number, height: number, updraftMode?: PhysicsUpdraftMode): Nullable<PhysicsUpdraftEvent>;
        /**
         * @param {Vector3} origin the of the vortex
         * @param {number} radius the radius of the vortex
         * @param {number} strength the strength of the vortex
         * @param {number} height   the height of the vortex
         */
        vortex(origin: Vector3, radius: number, strength: number, height: number): Nullable<PhysicsVortexEvent>;
    }
    /***** Radial explosion *****/
    class PhysicsRadialExplosionEvent {
        private _scene;
        private _sphere;
        private _sphereOptions;
        private _rays;
        private _dataFetched;
        constructor(scene: Scene);
        /**
         * Returns the data related to the radial explosion event (sphere & rays).
         * @returns {PhysicsRadialExplosionEventData}
         */
        getData(): PhysicsRadialExplosionEventData;
        /**
         * Returns the force and contact point of the impostor or false, if the impostor is not affected by the force/impulse.
         * @param impostor
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear
         * @returns {Nullable<PhysicsForceAndContactPoint>}
         */
        getImpostorForceAndContactPoint(impostor: PhysicsImpostor, origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff): Nullable<PhysicsForceAndContactPoint>;
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        dispose(force?: boolean): void;
        /*** Helpers ***/
        private _prepareSphere();
        private _intersectsWithSphere(impostor, origin, radius);
    }
    /***** Gravitational Field *****/
    class PhysicsGravitationalFieldEvent {
        private _physicsHelper;
        private _scene;
        private _origin;
        private _radius;
        private _strength;
        private _falloff;
        private _tickCallback;
        private _sphere;
        private _dataFetched;
        constructor(physicsHelper: PhysicsHelper, scene: Scene, origin: Vector3, radius: number, strength: number, falloff?: PhysicsRadialImpulseFalloff);
        /**
         * Returns the data related to the gravitational field event (sphere).
         * @returns {PhysicsGravitationalFieldEventData}
         */
        getData(): PhysicsGravitationalFieldEventData;
        /**
         * Enables the gravitational field.
         */
        enable(): void;
        /**
         * Disables the gravitational field.
         */
        disable(): void;
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        dispose(force?: boolean): void;
        private _tick();
    }
    /***** Updraft *****/
    class PhysicsUpdraftEvent {
        private _scene;
        private _origin;
        private _radius;
        private _strength;
        private _height;
        private _updraftMode;
        private _physicsEngine;
        private _originTop;
        private _originDirection;
        private _tickCallback;
        private _cylinder;
        private _cylinderPosition;
        private _dataFetched;
        constructor(_scene: Scene, _origin: Vector3, _radius: number, _strength: number, _height: number, _updraftMode: PhysicsUpdraftMode);
        /**
         * Returns the data related to the updraft event (cylinder).
         * @returns {PhysicsUpdraftEventData}
         */
        getData(): PhysicsUpdraftEventData;
        /**
         * Enables the updraft.
         */
        enable(): void;
        /**
         * Disables the cortex.
         */
        disable(): void;
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        dispose(force?: boolean): void;
        private getImpostorForceAndContactPoint(impostor);
        private _tick();
        /*** Helpers ***/
        private _prepareCylinder();
        private _intersectsWithCylinder(impostor);
    }
    /***** Vortex *****/
    class PhysicsVortexEvent {
        private _scene;
        private _origin;
        private _radius;
        private _strength;
        private _height;
        private _physicsEngine;
        private _originTop;
        private _centripetalForceThreshold;
        private _updraftMultiplier;
        private _tickCallback;
        private _cylinder;
        private _cylinderPosition;
        private _dataFetched;
        constructor(_scene: Scene, _origin: Vector3, _radius: number, _strength: number, _height: number);
        /**
         * Returns the data related to the vortex event (cylinder).
         * @returns {PhysicsVortexEventData}
         */
        getData(): PhysicsVortexEventData;
        /**
         * Enables the vortex.
         */
        enable(): void;
        /**
         * Disables the cortex.
         */
        disable(): void;
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        dispose(force?: boolean): void;
        private getImpostorForceAndContactPoint(impostor);
        private _tick();
        /*** Helpers ***/
        private _prepareCylinder();
        private _intersectsWithCylinder(impostor);
    }
    /***** Enums *****/
    /**
    * The strenght of the force in correspondence to the distance of the affected object
    */
    enum PhysicsRadialImpulseFalloff {
        Constant = 0,
        Linear = 1,
    }
    /**
     * The strenght of the force in correspondence to the distance of the affected object
     */
    enum PhysicsUpdraftMode {
        Center = 0,
        Perpendicular = 1,
    }
    /***** Data interfaces *****/
    interface PhysicsForceAndContactPoint {
        force: Vector3;
        contactPoint: Vector3;
    }
    interface PhysicsRadialExplosionEventData {
        sphere: Mesh;
        rays: Array<Ray>;
    }
    interface PhysicsGravitationalFieldEventData {
        sphere: Mesh;
    }
    interface PhysicsUpdraftEventData {
        cylinder: Mesh;
    }
    interface PhysicsVortexEventData {
        cylinder: Mesh;
    }
}

declare module 'babylonjs/physics' {
    class CannonJSPlugin implements IPhysicsEnginePlugin {
        private _useDeltaForWorldStep;
        world: any;
        name: string;
        private _physicsMaterials;
        private _fixedTimeStep;
        BJSCANNON: any;
        constructor(_useDeltaForWorldStep?: boolean, iterations?: number);
        setGravity(gravity: Vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void;
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        private _processChildMeshes(mainImpostor);
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(impostorJoint: PhysicsImpostorJoint): void;
        removeJoint(impostorJoint: PhysicsImpostorJoint): void;
        private _addMaterial(name, friction, restitution);
        private _checkWithEpsilon(value);
        private _createShape(impostor);
        private _createHeightmap(object, pointDepth?);
        private _minus90X;
        private _plus90X;
        private _tmpPosition;
        private _tmpDeltaPosition;
        private _tmpUnityRotation;
        private _updatePhysicsBodyTransformation(impostor);
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
        isSupported(): boolean;
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        wakeUpBody(impostor: PhysicsImpostor): void;
        updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed?: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number): void;
        syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
        getRadius(impostor: PhysicsImpostor): number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
        dispose(): void;
        private _extendNamespace();
    }
}

declare module 'babylonjs/physics' {
    class OimoJSPlugin implements IPhysicsEnginePlugin {
        world: any;
        name: string;
        BJSOIMO: any;
        constructor(iterations?: number);
        setGravity(gravity: Vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        private _tmpImpostorsArray;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void;
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        private _tmpPositionVector;
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(impostorJoint: PhysicsImpostorJoint): void;
        removeJoint(impostorJoint: PhysicsImpostorJoint): void;
        isSupported(): boolean;
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
        private _getLastShape(body);
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        wakeUpBody(impostor: PhysicsImpostor): void;
        updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
        syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
        getRadius(impostor: PhysicsImpostor): number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
        dispose(): void;
    }
}

import {EffectFallbacks,EffectCreationOptions,Effect,Nullable,float,double,int,FloatArray,IndicesArray,KeyboardEventTypes,KeyboardInfo,KeyboardInfoPre,PointerEventTypes,PointerInfoBase,PointerInfoPre,PointerInfo,ToGammaSpace,ToLinearSpace,Epsilon,Color3,Color4,Vector2,Vector3,Vector4,ISize,Size,Quaternion,Matrix,Plane,Viewport,Frustum,Space,Axis,BezierCurve,Orientation,Angle,Arc2,Path2,Path3D,Curve3,PositionNormalVertex,PositionNormalTextureVertex,Tmp,Scalar,expandToProperty,serialize,serializeAsTexture,serializeAsColor3,serializeAsFresnelParameters,serializeAsVector2,serializeAsVector3,serializeAsMeshReference,serializeAsColorCurves,serializeAsColor4,serializeAsImageProcessingConfiguration,serializeAsQuaternion,SerializationHelper,EventState,Observer,MultiObserver,Observable,SmartArray,SmartArrayNoDuplicate,IAnimatable,LoadFileError,RetryStrategy,IFileRequest,Tools,PerfCounter,className,AsyncLoop,_AlphaState,_DepthCullingState,_StencilState,InstancingAttributeInfo,RenderTargetCreationOptions,EngineCapabilities,EngineOptions,IDisplayChangedEventArgs,Engine,Node,BoundingSphere,BoundingBox,ICullable,BoundingInfo,TransformNode,AbstractMesh,Light,Camera,RenderingManager,RenderingGroup,IDisposable,IActiveMeshCandidateProvider,RenderingGroupInfo,Scene,Buffer,VertexBuffer,InternalTexture,BaseTexture,Texture,_InstancesBatch,Mesh,BaseSubMesh,SubMesh,MaterialDefines,Material,UniformBuffer,IGetSetVerticesData,VertexData,Geometry,_PrimitiveGeometry,RibbonGeometry,BoxGeometry,SphereGeometry,DiscGeometry,CylinderGeometry,TorusGeometry,GroundGeometry,TiledGroundGeometry,PlaneGeometry,TorusKnotGeometry,PostProcessManager,PerformanceMonitor,RollingAverage,IImageProcessingConfigurationDefines,ImageProcessingConfiguration,ColorGradingTexture,ColorCurves,Behavior,MaterialHelper,PushMaterial,StandardMaterialDefines,StandardMaterial} from 'babylonjs/core';
import {EngineInstrumentation,SceneInstrumentation,_TimeToken} from 'babylonjs/instrumentation';
import {Particle,IParticleSystem,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter,IParticleEmitterType} from 'babylonjs/particles';
import {GPUParticleSystem} from 'babylonjs/gpuParticles';
import {FramingBehavior,BouncingBehavior,AutoRotationBehavior} from 'babylonjs/cameraBehaviors';
import {NullEngineOptions,NullEngine} from 'babylonjs/nullEngine';
import {TextureTools} from 'babylonjs/textureTools';
import {SolidParticle,ModelShape,DepthSortedParticle,SolidParticleSystem} from 'babylonjs/solidParticles';
import {Collider,CollisionWorker,ICollisionCoordinator,SerializedMesh,SerializedSubMesh,SerializedGeometry,BabylonMessage,SerializedColliderToWorker,WorkerTaskType,WorkerReply,CollisionReplyPayload,InitPayload,CollidePayload,UpdatePayload,WorkerReplyType,CollisionCoordinatorWorker,CollisionCoordinatorLegacy} from 'babylonjs/collisions';
import {IntersectionInfo,PickingInfo,Ray} from 'babylonjs/picking';
import {SpriteManager,Sprite} from 'babylonjs/sprites';
import {AnimationRange,AnimationEvent,PathCursor,Animation,TargetedAnimation,AnimationGroup,RuntimeAnimation,Animatable,IEasingFunction,EasingFunction,CircleEase,BackEase,BounceEase,CubicEase,ElasticEase,ExponentialEase,PowerEase,QuadraticEase,QuarticEase,QuinticEase,SineEase,BezierCurveEase} from 'babylonjs/animations';
import {Condition,ValueCondition,PredicateCondition,StateCondition,Action,ActionEvent,ActionManager,InterpolateValueAction,SwitchBooleanAction,SetStateAction,SetValueAction,IncrementValueAction,PlayAnimationAction,StopAnimationAction,DoNothingAction,CombineAction,ExecuteCodeAction,SetParentAction,PlaySoundAction,StopSoundAction} from 'babylonjs/actions';
import {GroundMesh,InstancedMesh,LinesMesh} from 'babylonjs/additionalMeshes';
import {ShaderMaterial} from 'babylonjs/shaderMaterial';
import {MeshBuilder} from 'babylonjs/meshBuilder';
import {PBRBaseMaterial,PBRBaseSimpleMaterial,PBRMaterial,PBRMetallicRoughnessMaterial,PBRSpecularGlossinessMaterial} from 'babylonjs/pbrMaterial';
import {CameraInputTypes,ICameraInput,CameraInputsMap,CameraInputsManager,TargetCamera} from 'babylonjs/targetCamera';
import {ArcRotateCameraKeyboardMoveInput,ArcRotateCameraMouseWheelInput,ArcRotateCameraPointersInput,ArcRotateCameraInputsManager,ArcRotateCamera} from 'babylonjs/arcRotateCamera';
import {FreeCameraMouseInput,FreeCameraKeyboardMoveInput,FreeCameraInputsManager,FreeCamera} from 'babylonjs/freeCamera';
import {HemisphericLight} from 'babylonjs/hemisphericLight';
import {IShadowLight,ShadowLight,PointLight} from 'babylonjs/pointLight';
import {DirectionalLight} from 'babylonjs/directionalLight';
import {SpotLight} from 'babylonjs/spotLight';
import {CubeTexture,RenderTargetTexture,IMultiRenderTargetOptions,MultiRenderTarget,MirrorTexture,RefractionTexture,DynamicTexture,VideoTexture,RawTexture} from 'babylonjs/additionalTextures';
import {AudioEngine,Sound,SoundTrack,Analyser} from 'babylonjs/audio';
import {ILoadingScreen,DefaultLoadingScreen,SceneLoaderProgressEvent,ISceneLoaderPluginExtensions,ISceneLoaderPluginFactory,ISceneLoaderPlugin,ISceneLoaderPluginAsync,SceneLoader,FilesInput} from 'babylonjs/loader';
import {IShadowGenerator,ShadowGenerator} from 'babylonjs/shadows';
import {StringDictionary} from 'babylonjs/stringDictionary';
import {Tags,AndOrNotEvaluator} from 'babylonjs/userData';
import {FresnelParameters} from 'babylonjs/fresnel';
import {MultiMaterial} from 'babylonjs/multiMaterial';
import {Database} from 'babylonjs/offline';
import {FreeCameraTouchInput,TouchCamera} from 'babylonjs/touchCamera';
import {ProceduralTexture,CustomProceduralTexture} from 'babylonjs/procedural';
import {FreeCameraGamepadInput,ArcRotateCameraGamepadInput,GamepadManager,StickValues,GamepadButtonChanges,Gamepad,GenericPad,Xbox360Button,Xbox360Dpad,Xbox360Pad,PoseEnabledControllerType,MutableGamepadButton,ExtendedGamepadButton,PoseEnabledControllerHelper,PoseEnabledController,WebVRController,OculusTouchController,ViveController,GenericController,WindowsMotionController} from 'babylonjs/gamepad';
import {FollowCamera,ArcFollowCamera,UniversalCamera,GamepadCamera} from 'babylonjs/additionalCameras';
import {DepthRenderer} from 'babylonjs/depthRenderer';
import {GeometryBufferRenderer} from 'babylonjs/geometryBufferRenderer';
import {PostProcessOptions,PostProcess,PassPostProcess} from 'babylonjs/postProcesses';
import {BlurPostProcess} from 'babylonjs/additionalPostProcess_blur';
import {FxaaPostProcess} from 'babylonjs/additionalPostProcess_fxaa';
import {HighlightsPostProcess} from 'babylonjs/additionalPostProcess_highlights';
import {RefractionPostProcess,BlackAndWhitePostProcess,ConvolutionPostProcess,FilterPostProcess,VolumetricLightScatteringPostProcess,ColorCorrectionPostProcess,TonemappingOperator,TonemapPostProcess,DisplayPassPostProcess,ImageProcessingPostProcess} from 'babylonjs/additionalPostProcesses';
import {PostProcessRenderPipelineManager,PostProcessRenderPass,PostProcessRenderEffect,PostProcessRenderPipeline} from 'babylonjs/renderingPipeline';
import {SSAORenderingPipeline,SSAO2RenderingPipeline,LensRenderingPipeline,StandardRenderingPipeline} from 'babylonjs/additionalRenderingPipeline';
import {DefaultRenderingPipeline} from 'babylonjs/defaultRenderingPipeline';
import {Bone,BoneIKController,BoneLookController,Skeleton} from 'babylonjs/bones';
import {SphericalPolynomial,SphericalHarmonics,CubeMapToSphericalPolynomialTools,CubeMapInfo,PanoramaToCubeMapTools,HDRInfo,HDRTools,HDRCubeTexture} from 'babylonjs/hdr';
import {CSG} from 'babylonjs/csg';
import {Polygon,PolygonMeshBuilder} from 'babylonjs/polygonMesh';
import {LensFlare,LensFlareSystem} from 'babylonjs/lensFlares';
import {TGATools,DDSInfo,DDSTools,KhronosTextureContainer} from 'babylonjs/textureFormats';
import {Debug,RayHelper,DebugLayer,BoundingBoxRenderer} from 'babylonjs/debug';
import {MorphTarget,MorphTargetManager} from 'babylonjs/morphTargets';
import {IOctreeContainer,Octree,OctreeBlock} from 'babylonjs/octrees';
import {SIMDHelper} from 'babylonjs/simd';
import {VRDistortionCorrectionPostProcess,AnaglyphPostProcess,StereoscopicInterlacePostProcess,FreeCameraDeviceOrientationInput,ArcRotateCameraVRDeviceOrientationInput,VRCameraMetrics,DevicePose,PoseControlled,WebVROptions,WebVRFreeCamera,DeviceOrientationCamera,VRDeviceOrientationFreeCamera,VRDeviceOrientationGamepadCamera,VRDeviceOrientationArcRotateCamera,AnaglyphFreeCamera,AnaglyphArcRotateCamera,AnaglyphGamepadCamera,AnaglyphUniversalCamera,StereoscopicFreeCamera,StereoscopicArcRotateCamera,StereoscopicGamepadCamera,StereoscopicUniversalCamera,VRTeleportationOptions,VRExperienceHelperOptions,VRExperienceHelper} from 'babylonjs/vr';
import {JoystickAxis,VirtualJoystick,VirtualJoysticksCamera,FreeCameraVirtualJoystickInput} from 'babylonjs/virtualJoystick';
import {ISimplifier,ISimplificationSettings,SimplificationSettings,ISimplificationTask,SimplificationQueue,SimplificationType,DecimationTriangle,DecimationVertex,QuadraticMatrix,Reference,QuadraticErrorSimplification,MeshLODLevel,SceneOptimization,TextureOptimization,HardwareScalingOptimization,ShadowsOptimization,PostProcessesOptimization,LensFlaresOptimization,ParticlesOptimization,RenderTargetsOptimization,MergeMeshesOptimization,SceneOptimizerOptions,SceneOptimizer} from 'babylonjs/optimizations';
import {OutlineRenderer,EdgesRenderer,IHighlightLayerOptions,HighlightLayer} from 'babylonjs/highlights';
import {SceneSerializer} from 'babylonjs/serialization';
import {AssetTaskState,AbstractAssetTask,IAssetsProgressEvent,AssetsProgressEvent,MeshAssetTask,TextFileAssetTask,BinaryFileAssetTask,ImageAssetTask,ITextureAssetTask,TextureAssetTask,CubeTextureAssetTask,HDRCubeTextureAssetTask,AssetsManager} from 'babylonjs/assetsManager';
import {ReflectionProbe} from 'babylonjs/probes';
import {BackgroundMaterial} from 'babylonjs/backgroundMaterial';
import {Layer} from 'babylonjs/layer';
import {IEnvironmentHelperOptions,EnvironmentHelper} from 'babylonjs/environmentHelper';
