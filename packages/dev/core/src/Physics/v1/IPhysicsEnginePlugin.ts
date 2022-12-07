import type { Nullable } from "../../types";
import type { Vector3, Quaternion } from "../../Maths/math.vector";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { PhysicsImpostor } from "./physicsImpostor";
import type { PhysicsJoint, IMotorEnabledJoint } from "./physicsJoint";
import type { PhysicsRaycastResult } from "../physicsRaycastResult";

/**
 * Interface used to describe a physics joint
 */
export interface PhysicsImpostorJoint {
    /** Defines the main impostor to which the joint is linked */
    mainImpostor: PhysicsImpostor;
    /** Defines the impostor that is connected to the main impostor using this joint */
    connectedImpostor: PhysicsImpostor;
    /** Defines the joint itself */
    joint: PhysicsJoint;
}

/** @internal */
export interface IPhysicsEnginePlugin {
    /**
     *
     */
    world: any;
    /**
     *
     */
    name: string;
    setGravity(gravity: Vector3): void;
    setTimeStep(timeStep: number): void;
    getTimeStep(): number;
    executeStep(delta: number, impostors: Array<PhysicsImpostor>): void; //not forgetting pre and post events
    getPluginVersion(): number;
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
    getBodyPressure?(impostor: PhysicsImpostor): number;
    setBodyPressure?(impostor: PhysicsImpostor, pressure: number): void;
    getBodyStiffness?(impostor: PhysicsImpostor): number;
    setBodyStiffness?(impostor: PhysicsImpostor, stiffness: number): void;
    getBodyVelocityIterations?(impostor: PhysicsImpostor): number;
    setBodyVelocityIterations?(impostor: PhysicsImpostor, velocityIterations: number): void;
    getBodyPositionIterations?(impostor: PhysicsImpostor): number;
    setBodyPositionIterations?(impostor: PhysicsImpostor, positionIterations: number): void;
    appendAnchor?(impostor: PhysicsImpostor, otherImpostor: PhysicsImpostor, width: number, height: number, influence: number, noCollisionBetweenLinkedBodies: boolean): void;
    appendHook?(impostor: PhysicsImpostor, otherImpostor: PhysicsImpostor, length: number, influence: number, noCollisionBetweenLinkedBodies: boolean): void;
    sleepBody(impostor: PhysicsImpostor): void;
    wakeUpBody(impostor: PhysicsImpostor): void;
    raycast(from: Vector3, to: Vector3): PhysicsRaycastResult;
    raycastToRef(from: Vector3, to: Vector3, result: PhysicsRaycastResult): void;

    //Joint Update
    updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
    setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
    setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
    getRadius(impostor: PhysicsImpostor): number;
    getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
    syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
    dispose(): void;
}
