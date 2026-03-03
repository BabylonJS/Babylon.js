import { Vector3, Quaternion, Matrix, TmpVectors } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import type { DeepImmutableObject } from "../../types";
import { PhysicsBody } from "./physicsBody";
import { PhysicsShapeCapsule, type PhysicsShape } from "./physicsShape";
import { PhysicsMotionType } from "./IPhysicsEnginePlugin";
import type { HavokPlugin } from "./Plugins/havokPlugin";
import { BuildArray } from "../../Misc/arrayTools";
import { TransformNode } from "../../Meshes/transformNode";
import { Observable } from "../../Misc/observable";

/**
 * Shape properties for the character controller
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface CharacterShapeOptions {
    /**
     * optional shape used for collision detection
     */
    shape?: PhysicsShape;
    /**
     * capsule height for the capsule shape if no shape is provided
     */
    capsuleHeight?: number;
    /**
     * capsule radius for the capsule shape if no shape is provided
     */
    capsuleRadius?: number;
}

/**
 * Collision event data for the character controller
 */
export interface ICharacterControllerCollisionEvent {
    /**
     * The collider physics body
     */
    collider: PhysicsBody;
    /**
     *
     */
    colliderIndex: number;
    /**
     * Separation force applied to the collider
     */
    impulse: Vector3;
    /**
     * Position where the impulse is applied
     */
    impulsePosition: Vector3;
}

/**
 * State of the character on the surface
 */
export const enum CharacterSupportedState {
    UNSUPPORTED,
    SLIDING,
    SUPPORTED,
}

/**
 * Surface information computed by checkSupport method
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface CharacterSurfaceInfo {
    /**
     * Indicates whether the surface is dynamic.
     * A dynamic surface is one that can change its properties over time,
     * such as moving platforms or surfaces that can be affected by external forces.
     * surfaceInfo.supportedState is always CharacterSupportedState.SUPPORTED when isSurfaceDynamic is true.
     */
    isSurfaceDynamic: boolean;
    /**
     * The supported state of the character on the surface.
     */
    supportedState: CharacterSupportedState;
    /**
     * The average normal vector of the surface.
     * This vector is perpendicular to the surface and points outwards.
     */
    averageSurfaceNormal: Vector3;
    /**
     * The average velocity of the surface.
     * This vector represents the speed and direction in which the surface is moving.
     */
    averageSurfaceVelocity: Vector3;
    /**
     * The average angular velocity of the surface.
     */
    averageAngularSurfaceVelocity: Vector3;
}

interface IContact {
    /** @internal */
    position: Vector3;
    /** @internal */
    normal: Vector3;
    /** @internal */
    distance: number;
    /** @internal */
    fraction: number;
    /** @internal */
    bodyB: { body: PhysicsBody; index: number };
    /** @internal */
    allowedPenetration: number;
}

interface ISurfaceConstraintInfo {
    /** @internal */
    planeNormal: Vector3;
    /** @internal */
    planeDistance: number;
    /** @internal */
    velocity: Vector3;
    /** @internal */
    angularVelocity: Vector3;
    /** @internal */
    staticFriction: number;
    /** @internal */
    extraUpStaticFriction: number;
    /** @internal */
    extraDownStaticFriction: number;
    /** @internal */
    dynamicFriction: number;
    /** @internal */
    priority: number;
}

const enum SurfaceConstraintInteractionStatus {
    OK,
    FAILURE_3D,
    FAILURE_2D,
}
interface ISurfaceConstraintInteraction {
    /** @internal */
    touched: boolean;
    /** @internal */
    stopped: boolean;
    /** @internal */
    surfaceTime: number;
    /** @internal */
    penaltyDistance: number;
    /** @internal */
    status: SurfaceConstraintInteractionStatus;
}

/** @internal */
class SimplexSolverOutput {
    /** @internal */
    public position: Vector3;
    /** @internal */
    public velocity: Vector3;
    /** @internal */
    public deltaTime: number;
    /** @internal */
    public planeInteractions: ISurfaceConstraintInteraction[];
}

/** @internal */
class SimplexSolverActivePlanes {
    /** @internal */
    public index: number;
    /** @internal */
    public constraint: ISurfaceConstraintInfo;
    /** @internal */
    public interaction: ISurfaceConstraintInteraction;

    /** @internal */
    public copyFrom(other: SimplexSolverActivePlanes) {
        this.index = other.index;
        this.constraint = other.constraint;
        this.interaction = other.interaction;
    }
}

/** @internal */
class SimplexSolverInfo {
    /** @internal */
    public supportPlanes: Array<SimplexSolverActivePlanes> = new Array<SimplexSolverActivePlanes>(4);
    /** @internal */
    public numSupportPlanes: number = 0;
    /** @internal */
    public currentTime: number = 0;
    /** @internal */
    public inputConstraints: ISurfaceConstraintInfo[];
    /** @internal */
    public outputInteractions: ISurfaceConstraintInteraction[];
    /** @internal */
    public getOutput(constraint: ISurfaceConstraintInfo): ISurfaceConstraintInteraction {
        return this.outputInteractions[this.inputConstraints.indexOf(constraint)]; //<todo.eoin This is O(1) in C++! Equivalent in TS?
    }
}

/** @internal */
function ContactFromCast(hp: HavokPlugin, cp: any /*ContactPoint*/, castPath: Vector3, hitFraction: number, keepDistance: number): IContact {
    const bodyMap = (hp as any)._bodies;

    const normal = Vector3.FromArray(cp[4]);
    const dist = -hitFraction * castPath.dot(normal);
    return {
        position: Vector3.FromArray(cp[3]),
        normal: normal,
        distance: dist,
        fraction: hitFraction,
        bodyB: bodyMap.get(cp[0][0])!,
        allowedPenetration: Math.min(Math.max(keepDistance - dist, 0.0), keepDistance),
    };
}

/**
 * Character controller using physics
 */
export class PhysicsCharacterController {
    private _position: Vector3;
    private _orientation: Quaternion = Quaternion.Identity();
    private _velocity: Vector3;
    private _lastVelocity: Vector3;
    private _shape: PhysicsShape;
    private _body: PhysicsBody;
    private _transformNode: TransformNode;
    private _ownShape: boolean;
    private _manifold: IContact[] = [];
    private _lastDisplacement: Vector3;
    private _contactAngleSensitivity = 10.0;
    private _lastInvDeltaTime: number;
    private _scene: Scene;
    private _tmpMatrix = new Matrix();
    private _tmpVecs: Vector3[] = BuildArray(32, Vector3.Zero);

    /**
     * minimum distance to make contact
     * default 0.05
     */
    public keepDistance: number = 0.05;
    /**
     * maximum distance to keep contact
     * default 0.1
     */
    public keepContactTolerance: number = 0.1;
    /**
     * maximum number of raycast per integration starp
     * default 10
     */
    public maxCastIterations: number = 10;
    /**
     * speed when recovery from penetration
     * default 1.0
     */
    public penetrationRecoverySpeed = 1.0;
    /**
     * friction with static surfaces
     * default 0
     */
    public staticFriction = 0;
    /**
     * friction with dynamic surfaces
     * default 1
     */
    public dynamicFriction = 1;
    /**
     * cosine value of slope angle that can be climbed
     * computed as `Math.cos(Math.PI * (angleInDegree / 180.0));`
     * default 0.5 (value for a 60deg angle)
     */
    public maxSlopeCosine = 0.5;
    /**
     * character maximum speed
     * default 10
     */
    public maxCharacterSpeedForSolver = 10.0;
    /**
     * up vector
     */
    public up = new Vector3(0, 1, 0);
    /**
     * Strength when pushing other bodies
     * default 1e38
     */
    public characterStrength = 1e38;

    /**
     * Acceleration factor. A value of 1 means reaching max velocity immediately
     */
    public acceleration = 0.05;

    /**
     * maximum acceleration in world space coordinate
     */
    public maxAcceleration = 50;

    /**
     * character mass
     * default 0
     */
    public characterMass = 0;

    /**
     * Observable for trigger entered and trigger exited events
     */
    public onTriggerCollisionObservable = new Observable<ICharacterControllerCollisionEvent>();

    private _startCollector;
    private _castCollector;

    // If the difference between the cast displacement and the simplex solver output position is less than this
    // value (per component), do not do a second cast to check if it's possible to reach the output position.
    private _displacementEps = 1e-4;

    /**
     * instanciate a new characterController
     * @param position Initial position
     * @param characterShapeOptions character physics shape options
     * @param scene Scene
     */
    public constructor(position: Vector3, characterShapeOptions: CharacterShapeOptions, scene: Scene) {
        this._position = position.clone();
        this._velocity = Vector3.Zero();
        this._lastVelocity = Vector3.Zero();
        const r = characterShapeOptions.capsuleRadius ?? 0.6;
        const h = characterShapeOptions.capsuleHeight ?? 1.8;
        this._tmpVecs[0].set(0, h * 0.5 - r, 0);
        this._tmpVecs[1].set(0, -h * 0.5 + r, 0);
        this._ownShape = !characterShapeOptions.shape;
        this._shape = characterShapeOptions.shape ?? new PhysicsShapeCapsule(this._tmpVecs[0], this._tmpVecs[1], r, scene);
        this._transformNode = new TransformNode("CCTransformNode", scene);
        this._transformNode.position.copyFrom(this._position);
        this._body = new PhysicsBody(this._transformNode, PhysicsMotionType.ANIMATED, false, scene);
        this._body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this._body.shape = this._shape;
        this._body.disablePreStep = false;
        this._lastInvDeltaTime = 1.0 / 60.0;
        this._lastDisplacement = Vector3.Zero();
        this._scene = scene;

        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;

        this._startCollector = hknp.HP_QueryCollector_Create(16)[1];
        this._castCollector = hknp.HP_QueryCollector_Create(16)[1];
    }

    /**
     * Dispose the character controller
     */
    public dispose() {
        if (this._ownShape) {
            this._shape.dispose();
        }
        this._body.dispose();
        this._transformNode.dispose();

        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;
        hknp.HP_QueryCollector_Release(this._startCollector);
        hknp.HP_QueryCollector_Release(this._castCollector);
    }

    /**
     * Get shape used for collision
     */
    public get shape() {
        return this._shape;
    }

    /**
     * Set shape used for collision
     */
    public set shape(value: PhysicsShape) {
        this._body.shape = this._shape;
        if (this._ownShape) {
            this._shape.dispose();
        }
        this._shape = value;
        this._ownShape = false;
    }

    /**
     * Character position
     * @returns Character position
     */
    public getPosition(): Vector3 {
        return this._position;
    }

    /**
     * Teleport character to a new position
     * @param position new position
     */
    public setPosition(position: Vector3) {
        this._position.copyFrom(position);
        this._transformNode.position.copyFrom(this._position);
    }

    /**
     * Character velocity
     * @returns Character velocity vector
     */
    public getVelocity(): Vector3 {
        return this._velocity;
    }

    /**
     * Set velocity vector
     * @param velocity vector
     */
    public setVelocity(velocity: Vector3) {
        this._velocity.copyFrom(velocity);
    }

    protected _validateManifold() {
        const newManifold = [];
        for (let i = 0; i < this._manifold.length; i++) {
            if (!this._manifold[i].bodyB.body.isDisposed) {
                newManifold.push(this._manifold[i]);
            }
        }
        this._manifold = newManifold;
    }

    private _getPointVelocityToRef(body: { body: PhysicsBody; index: number }, pointWorld: Vector3, result: Vector3) {
        //<todo does this really not exist in body interface?
        const comWorld = this._tmpVecs[10];
        this._getComWorldToRef(body, comWorld);
        const relPos = this._tmpVecs[11];
        pointWorld.subtractToRef(comWorld, relPos);
        const av = this._tmpVecs[12];
        body.body.getAngularVelocityToRef(av, body.index);
        const arm = this._tmpVecs[13];
        Vector3.CrossToRef(av, relPos, arm);
        arm.addToRef(body.body.getLinearVelocity(body.index), result);
    }

    protected _compareContacts(contactA: IContact, contactB: IContact): number {
        const angSquared = (1.0 - contactA.normal.dot(contactB.normal)) * this._contactAngleSensitivity * this._contactAngleSensitivity;
        const planeDistSquared = (contactA.distance - contactB.distance) * (contactA.distance * contactB.distance);

        const p1Vel = this._tmpVecs[7];
        this._getPointVelocityToRef(contactA.bodyB, contactA.position, p1Vel);
        const p2Vel = this._tmpVecs[8];
        this._getPointVelocityToRef(contactB.bodyB, contactB.position, p2Vel);
        const velocityDiff = this._tmpVecs[9];
        p1Vel.subtractToRef(p2Vel, velocityDiff);
        const velocityDiffSquared = velocityDiff.lengthSquared();

        const fitness = angSquared * 10.0 + velocityDiffSquared * 0.1 + planeDistSquared;
        return fitness;
    }

    protected _findContact(referenceContact: IContact, contactList: IContact[], threshold: number) {
        let bestIdx = -1;
        let bestFitness = threshold;
        for (let i = 0; i < contactList.length; i++) {
            const fitness = this._compareContacts(referenceContact, contactList[i]);
            if (fitness < bestFitness) {
                bestFitness = fitness;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    protected _updateManifold(startCollector: any /*HP_CollectorId*/, castCollector: any /*HP_CollectorId*/, castPath: Vector3): number {
        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;

        const numProximityHits = hknp.HP_QueryCollector_GetNumHits(startCollector)[1];
        if (numProximityHits > 0) {
            const newContacts = [];
            let minDistance = 1e38;
            const bodyMap = (<any>hk)._bodies;
            for (let i = 0; i < numProximityHits; i++) {
                const [distance, , contactWorld] = hknp.HP_QueryCollector_GetShapeProximityResult(startCollector, i)[1];
                minDistance = Math.min(minDistance, distance);
                newContacts.push({
                    position: Vector3.FromArray(contactWorld[3]),
                    normal: Vector3.FromArray(contactWorld[4]),
                    distance: distance,
                    fraction: 0,
                    bodyB: bodyMap.get(contactWorld[0][0])!,
                    allowedPenetration: Math.min(Math.max(this.keepDistance - distance, 0.0), this.keepDistance),
                });
            }

            for (let i = this._manifold.length - 1; i >= 0; i--) {
                const currentContact = this._manifold[i];
                const bestMatch = this._findContact(currentContact, newContacts, 1.1);
                if (bestMatch >= 0) {
                    const newAllowedPenetration = Math.min(Math.max(this.keepDistance - newContacts[bestMatch].distance, 0.0), currentContact.allowedPenetration);
                    this._manifold[i] = newContacts[bestMatch];
                    this._manifold[i].allowedPenetration = newAllowedPenetration;
                    newContacts.splice(bestMatch, 1);
                } else {
                    this._manifold.splice(i, 1);
                }
            }

            const closestContactIndex = newContacts.findIndex((c) => c.distance == minDistance);
            if (closestContactIndex >= 0) {
                const bestMatch = this._findContact(newContacts[closestContactIndex], this._manifold, 0.1);
                if (bestMatch >= 0) {
                    const newAllowedPenetration = Math.min(
                        Math.max(this.keepDistance - newContacts[closestContactIndex].distance, 0.0),
                        this._manifold[bestMatch].allowedPenetration
                    );
                    this._manifold[bestMatch] = newContacts[closestContactIndex];
                    this._manifold[bestMatch].allowedPenetration = newAllowedPenetration;
                } else {
                    this._manifold.push(newContacts[closestContactIndex]);
                }
            }
        } else {
            // No start hits; clear manifold completely
            this._manifold.length = 0;
        }

        let numHitBodies = 0; //< == CASTCOLLECTOR_HIT_SINGLE_BODY
        // Process shape cast results if any
        const numCastHits = hknp.HP_QueryCollector_GetNumHits(castCollector)[1];
        if (numCastHits > 0) {
            let closestHitBody = null;
            for (let i = 0; i < numCastHits; i++) {
                const [fraction, , hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(castCollector, i)[1];
                if (closestHitBody == null) {
                    const contact = ContactFromCast(hk, hitWorld, castPath, fraction, this.keepDistance);
                    closestHitBody = hitWorld[0][0];
                    const bestMatch = this._findContact(contact, this._manifold, 0.1);
                    if (bestMatch == -1) {
                        this._manifold.push(contact);
                    }

                    if (contact.bodyB.body.getMotionType(contact.bodyB.index) == PhysicsMotionType.STATIC) {
                        // The closest body is static, so it cannot move away from CC and we don't need to look any further.
                        break;
                    }
                } else if (closestHitBody._pluginData && hitWorld[0] != closestHitBody._pluginData.hpBodyId) {
                    numHitBodies++;
                    break;
                }
            }
        }

        // Remove from the manifold contacts that are too similar as the simplex does not handle parallel planes
        for (let e1 = this._manifold.length - 1; e1 >= 0; e1--) {
            let e2 = e1 - 1;
            for (; e2 >= 0; e2--) {
                const fitness = this._compareContacts(this._manifold[e1], this._manifold[e2]);
                if (fitness < 0.1) {
                    break;
                }
            }
            if (e2 >= 0) {
                this._manifold.slice(e1, 1);
            }
        }

        return numHitBodies;
    }

    // Store previous positions per body for velocity calculation
    protected _bodyPositionTracking = new Map();

    protected _createSurfaceConstraint(dt: number, contact: IContact, timeTravelled: number): ISurfaceConstraintInfo {
        const constraint = {
            //let distance = contact.distance - this.keepDistance;
            planeNormal: contact.normal.clone(),
            planeDistance: contact.distance,
            staticFriction: this.staticFriction,
            dynamicFriction: this.dynamicFriction,
            extraUpStaticFriction: 0,
            extraDownStaticFriction: 0,
            velocity: Vector3.Zero(),
            angularVelocity: Vector3.Zero(),
            priority: 0,
        };

        const maxSlopeCosEps = 0.1;
        const maxSlopeCosine = Math.max(this.maxSlopeCosine, maxSlopeCosEps);
        const normalDotUp = contact.normal.dot(this.up);

        const contactPosition = contact.position.clone();
        if (normalDotUp > maxSlopeCosine) {
            const com = this.getPosition();
            const contactArm = this._tmpVecs[20];
            contact.position.subtractToRef(com, contactArm);
            const scale = contact.normal.dot(contactArm);
            contactPosition.x = com.x + this.up.x * scale;
            contactPosition.y = com.y + this.up.y * scale;
            contactPosition.z = com.z + this.up.z * scale;
        }

        const motionType = contact.bodyB.body.getMotionType(contact.bodyB.index);
        if (motionType != PhysicsMotionType.STATIC) {
            //<todo Need hknpMotionUtil::predictPontVelocity
        }

        const shift = constraint.velocity.dot(constraint.planeNormal) * timeTravelled;
        constraint.planeDistance -= shift;

        if (motionType == PhysicsMotionType.STATIC) {
            constraint.priority = 2;
        } else if (motionType == PhysicsMotionType.ANIMATED) {
            const bodyTransformNode = contact.bodyB.body.transformNode;
            const bodyId = bodyTransformNode.uniqueId;

            // Retrieve tracking data
            let tracking = this._bodyPositionTracking.get(bodyId);

            const currentFrameWorldMatrix = contact.bodyB.body.transformNode.getWorldMatrix();
            const frameId = this._scene.getFrameId();

            if (!tracking) {
                // Initialize tracking
                tracking = {
                    prevWorldMatrix: currentFrameWorldMatrix.clone(),
                    frameId: frameId,
                };
                this._bodyPositionTracking.set(bodyId, tracking);
            } else {
                // Only calculate velocity if this contact existed in the previous frame
                // This avoids huge delta spikes when first making contact or after gaps
                if (tracking.frameId + 1 === frameId) {
                    const previousFrameWorldMatrix = tracking.prevWorldMatrix;

                    const currentFrameWorldMatrixInverse = TmpVectors.Matrix[1];

                    currentFrameWorldMatrix.invertToRef(currentFrameWorldMatrixInverse);

                    const characterPosition = this.getPosition();
                    // compute characterPosition in body local space at previous frame
                    const characterLocalPosition = this._tmpVecs[21];
                    Vector3.TransformCoordinatesToRef(characterPosition, currentFrameWorldMatrixInverse, characterLocalPosition);

                    const characterWorldPosition = this._tmpVecs[22];
                    Vector3.TransformCoordinatesToRef(characterLocalPosition, previousFrameWorldMatrix, characterWorldPosition);
                    const playerDeltaPosition = this._tmpVecs[23];
                    characterPosition.subtractToRef(characterWorldPosition, playerDeltaPosition);

                    constraint.velocity.copyFrom(playerDeltaPosition);
                    constraint.velocity.scaleInPlace(1 / dt);
                    constraint.priority = 1;
                }
                tracking.prevWorldMatrix.copyFrom(currentFrameWorldMatrix);
                tracking.frameId = frameId;
            }
        }

        return constraint;
    }

    protected _addMaxSlopePlane(maxSlopeCos: number, up: Vector3, index: number, constraints: ISurfaceConstraintInfo[], allowedPenetration: number): boolean {
        const verticalComponent = constraints[index].planeNormal.dot(up);
        if (verticalComponent > 0.01 && verticalComponent < maxSlopeCos) {
            const newConstraint = {
                planeNormal: constraints[index].planeNormal.clone(),
                planeDistance: constraints[index].planeDistance,
                velocity: constraints[index].velocity.clone(),
                angularVelocity: constraints[index].angularVelocity.clone(),
                priority: constraints[index].priority,
                dynamicFriction: constraints[index].dynamicFriction,
                staticFriction: constraints[index].staticFriction,
                extraDownStaticFriction: constraints[index].extraDownStaticFriction,
                extraUpStaticFriction: constraints[index].extraUpStaticFriction,
            };
            const distance = newConstraint.planeDistance;
            newConstraint.planeNormal.subtractInPlace(up.scale(verticalComponent));
            newConstraint.planeNormal.normalize();
            if (distance >= 0) {
                newConstraint.planeDistance = distance * newConstraint.planeNormal.dot(constraints[index].planeNormal);
            } else {
                const penetrationToResolve = Math.min(0, distance + allowedPenetration);
                newConstraint.planeDistance = penetrationToResolve / newConstraint.planeNormal.dot(constraints[index].planeNormal);
                constraints[index].planeDistance = 0;
                this._resolveConstraintPenetration(newConstraint, this.penetrationRecoverySpeed);
            }
            constraints.push(newConstraint);
            return true;
        }
        return false;
    }

    protected _resolveConstraintPenetration(constraint: ISurfaceConstraintInfo, penetrationRecoverySpeed: number) {
        // If penetrating we add extra velocity to push the character back out
        const eps = 1e-6;
        if (constraint.planeDistance < -eps) {
            constraint.planeNormal.scaleToRef(constraint.planeDistance * penetrationRecoverySpeed, this._tmpVecs[6]);
            constraint.velocity.subtractInPlace(this._tmpVecs[6]);
        }
    }

    protected _createConstraintsFromManifold(dt: number, timeTravelled: number): ISurfaceConstraintInfo[] {
        const constraints = [];
        for (let i = 0; i < this._manifold.length; i++) {
            const surfaceConstraint = this._createSurfaceConstraint(dt, this._manifold[i], timeTravelled);
            constraints.push(surfaceConstraint);
            this._addMaxSlopePlane(this.maxSlopeCosine, this.up, i, constraints, this._manifold[i].allowedPenetration);
            this._resolveConstraintPenetration(surfaceConstraint, this.penetrationRecoverySpeed);
        }
        return constraints;
    }

    protected _simplexSolverSortInfo(info: SimplexSolverInfo) {
        // simple bubble sort by (priority,velocity)
        for (let i = 0; i < info.numSupportPlanes - 1; i++) {
            for (let j = i + 1; j < info.numSupportPlanes; j++) {
                const p0 = info.supportPlanes[i];
                const p1 = info.supportPlanes[j];
                if (p0.constraint.priority < p1.constraint.priority) {
                    continue;
                }
                if (p0.constraint.priority == p1.constraint.priority) {
                    const vel0 = p0.constraint.velocity.lengthSquared();
                    const vel1 = p1.constraint.velocity.lengthSquared();
                    if (vel0 < vel1) {
                        continue;
                    }
                }
                info.supportPlanes[i] = p1;
                info.supportPlanes[j] = p0;
            }
        }
    }

    protected _simplexSolverSolve1d(info: SimplexSolverInfo, sci: ISurfaceConstraintInfo, velocityIn: Vector3, velocityOut: Vector3) {
        const eps = 1e-5;
        const groundVelocity = sci.velocity;
        const relativeVelocity = this._tmpVecs[22];
        velocityIn.subtractToRef(groundVelocity, relativeVelocity);

        const planeVel = relativeVelocity.dot(sci.planeNormal);

        const origVelocity2 = relativeVelocity.lengthSquared();
        relativeVelocity.subtractInPlace(sci.planeNormal.scale(planeVel));
        {
            const vp2 = planeVel * planeVel;
            // static friction is active if
            //  velProjPlane * friction > |(velParallel)|
            //      vplane   *     f    >         vpar
            //      vp       *     f    >         vpar
            //      vp2      *     f2   >         vpar2
            const extraStaticFriction = relativeVelocity.dot(this.up) > 0 ? sci.extraUpStaticFriction : sci.extraDownStaticFriction;
            if (extraStaticFriction > 0) {
                const horizontal = this.up.cross(sci.planeNormal);
                const hor2 = horizontal.lengthSquared();
                let horVel = 0.0;
                if (hor2 > eps) {
                    horizontal.scaleInPlace(1 / Math.sqrt(hor2));

                    horVel = relativeVelocity.dot(horizontal);

                    // horizontal component
                    {
                        const horVel2 = horVel * horVel;
                        const f2 = sci.staticFriction * sci.staticFriction;
                        if (vp2 * f2 >= horVel2) {
                            relativeVelocity.subtractInPlace(horizontal.scale(horVel));
                            horVel = 0;
                        }
                    }
                }

                // vert component
                {
                    const vertVel2 = origVelocity2 - horVel * horVel - vp2;
                    const f2 = (sci.staticFriction + extraStaticFriction) * (sci.staticFriction + extraStaticFriction);
                    if (vp2 * f2 >= vertVel2) {
                        if (horVel == 0.0) {
                            velocityOut.copyFrom(groundVelocity);
                            return;
                        }
                    }
                }
            } else {
                // static friction is active if
                //  velProjPlane * friction > |(vel-velProjPlane)|
                //      vp       *     f    >         rvProj
                //
                //  -> vp * f >= rvProj
                //  -> vp * f >= sqrt( vel^2 - vp^2 )
                //  -> vp^2 ( f^2 + 1 ) >= vel^2
                const f2 = sci.staticFriction * sci.staticFriction;
                if (vp2 * (1 + f2) >= origVelocity2) {
                    velocityOut.copyFrom(groundVelocity);
                    return;
                }
            }
        }

        if (sci.dynamicFriction < 1) {
            //  apply dynamic friction 0 = conserve input velocity 1 = clip against normal
            const velOut2 = relativeVelocity.lengthSquared();
            if (velOut2 >= eps) {
                if (velOut2 > 1e-4 * origVelocity2) {
                    let f = Math.sqrt(origVelocity2 / velOut2);
                    f = sci.dynamicFriction + (1 - sci.dynamicFriction) * f;
                    relativeVelocity.scaleInPlace(f);
                    const p = sci.planeNormal.dot(relativeVelocity);
                    relativeVelocity.subtractInPlace(sci.planeNormal.scale(p));
                }
            }
        }
        velocityOut.copyFrom(relativeVelocity);
        velocityOut.addInPlace(groundVelocity);
    }

    protected _simplexSolverSolveTest1d(sci: ISurfaceConstraintInfo, velocityIn: Vector3): boolean {
        const eps = 1e-3;
        const relativeVelocity = this._tmpVecs[23];
        velocityIn.subtractToRef(sci.velocity, relativeVelocity);
        return relativeVelocity.dot(sci.planeNormal) < -eps;
    }

    protected _simplexSolverSolve2d(
        info: SimplexSolverInfo,
        maxSurfaceVelocity: Vector3,
        sci0: ISurfaceConstraintInfo,
        sci1: ISurfaceConstraintInfo,
        velocityIn: Vector3,
        velocityOut: Vector3
    ) {
        const eps = 1e-5;
        const axis = sci0.planeNormal.cross(sci1.planeNormal);
        const axisLen2 = axis.lengthSquared();

        let solveSequentially = false;
        let axisVel = null;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Check for parallel planes
            if (axisLen2 <= eps || solveSequentially) {
                info.getOutput(sci0).status = SurfaceConstraintInteractionStatus.FAILURE_2D;
                info.getOutput(sci1).status = SurfaceConstraintInteractionStatus.FAILURE_2D;

                if (sci0.priority > sci1.priority) {
                    this._simplexSolverSolve1d(info, sci1, velocityIn, velocityOut);
                    this._simplexSolverSolve1d(info, sci0, velocityIn, velocityOut);
                } else {
                    this._simplexSolverSolve1d(info, sci0, velocityIn, velocityOut);
                    this._simplexSolverSolve1d(info, sci1, velocityIn, velocityOut);
                }
                return;
            }

            const invAxisLen = 1.0 / Math.sqrt(axisLen2);
            axis.scaleInPlace(invAxisLen);

            //  Calculate the velocity of the free axis
            {
                const r0 = sci0.planeNormal.cross(sci1.planeNormal);
                const r1 = sci1.planeNormal.cross(axis);
                const r2 = axis.cross(sci0.planeNormal);

                const sVel = sci0.velocity.add(sci1.velocity);

                const t = this._tmpVecs[2];
                t.set(0.5 * axis.dot(sVel), sci0.planeNormal.dot(sci0.velocity), sci1.planeNormal.dot(sci1.velocity));
                const m = Matrix.FromValues(r0.x, r1.x, r2.x, 0, r0.y, r1.y, r2.y, 0, r0.z, r1.z, r2.z, 0, 0, 0, 0, 1);
                axisVel = Vector3.TransformNormal(t, m);
                axisVel.scaleInPlace(invAxisLen);

                if (Math.abs(axisVel.x) > maxSurfaceVelocity.x || Math.abs(axisVel.y) > maxSurfaceVelocity.y || Math.abs(axisVel.z) > maxSurfaceVelocity.z) {
                    solveSequentially = true;
                } else {
                    break;
                }
            }
        }

        const groundVelocity = axisVel;
        const relativeVelocity = this._tmpVecs[24];
        velocityIn.subtractToRef(groundVelocity, relativeVelocity);

        const vel2 = relativeVelocity.lengthSquared();
        const axisVert = this.up.dot(axis);
        let axisProjVelocity = relativeVelocity.dot(axis);

        let staticFriction = sci0.staticFriction + sci1.staticFriction;
        if (axisVert * axisProjVelocity > 0) {
            staticFriction += (sci0.extraUpStaticFriction + sci1.extraUpStaticFriction) * axisVert;
        } else {
            staticFriction += (sci0.extraDownStaticFriction + sci1.extraDownStaticFriction) * axisVert;
        }
        staticFriction *= 0.5;

        const dynamicFriction = (sci0.dynamicFriction + sci1.dynamicFriction) * 0.5;
        // static friction is active if
        //  |vel-axisProjVelocity|(rv) * friction(f) > axisProjVelocity(av)
        //  -> sqrt( vel2 - av2 ) * f > av
        //  -> (vel2 - av2) * f2  > av2
        const f2 = staticFriction * staticFriction;
        const av2 = axisProjVelocity * axisProjVelocity;
        if ((vel2 - av2) * f2 >= av2) {
            // static friction kicks in
            velocityOut.copyFrom(groundVelocity);
            return;
        }

        if (dynamicFriction < 1) {
            //  apply dynamic friction
            if (axisProjVelocity * axisProjVelocity > 1e-4 * vel2) {
                const tmp = 1.0 / axisProjVelocity;
                const f = Math.abs(tmp) * Math.sqrt(vel2) * (1.0 - dynamicFriction) + dynamicFriction;
                axisProjVelocity *= f;
            }
        }
        velocityOut.copyFrom(groundVelocity);
        velocityOut.addInPlace(axis.scale(axisProjVelocity));
    }

    protected _simplexSolverSolve3d(
        info: SimplexSolverInfo,
        maxSurfaceVelocity: Vector3,
        sci0: ISurfaceConstraintInfo,
        sci1: ISurfaceConstraintInfo,
        sci2: ISurfaceConstraintInfo,
        allowResort: boolean,
        velocityIn: Vector3,
        velocityOut: Vector3
    ) {
        const eps = 1e-5;
        //  Calculate the velocity of the point axis
        let pointVel = null;
        {
            const r0 = sci1.planeNormal.cross(sci2.planeNormal);
            const r1 = sci2.planeNormal.cross(sci0.planeNormal);
            const r2 = sci0.planeNormal.cross(sci1.planeNormal);

            const det = r0.dot(sci0.planeNormal);
            let solveSequentially = false;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (Math.abs(det) < eps || solveSequentially) {
                    if (allowResort) {
                        this._simplexSolverSortInfo(info);
                        sci0 = info.supportPlanes[0].constraint;
                        sci1 = info.supportPlanes[1].constraint;
                        sci2 = info.supportPlanes[2].constraint;
                    }
                    info.getOutput(sci0).status = SurfaceConstraintInteractionStatus.FAILURE_3D;
                    info.getOutput(sci1).status = SurfaceConstraintInteractionStatus.FAILURE_3D;
                    info.getOutput(sci2).status = SurfaceConstraintInteractionStatus.FAILURE_3D;

                    const oldNum = info.numSupportPlanes;
                    this._simplexSolverSolve2d(info, maxSurfaceVelocity, sci0, sci1, velocityIn, velocityOut);
                    if (oldNum == info.numSupportPlanes) {
                        this._simplexSolverSolve2d(info, maxSurfaceVelocity, sci0, sci2, velocityIn, velocityOut);
                    }
                    if (oldNum == info.numSupportPlanes) {
                        this._simplexSolverSolve2d(info, maxSurfaceVelocity, sci1, sci2, velocityIn, velocityOut);
                    }

                    return;
                }

                const t = this._tmpVecs[2];
                t.set(sci0.planeNormal.dot(sci0.velocity), sci1.planeNormal.dot(sci1.velocity), sci2.planeNormal.dot(sci2.velocity));
                const m = Matrix.FromValues(r0.x, r0.y, r0.z, 0, r1.x, r1.y, r1.z, 0, r2.x, r2.y, r2.z, 0, 0, 0, 0, 1);
                pointVel = Vector3.TransformNormal(t, m);
                pointVel.scaleInPlace(1 / det);
                if (Math.abs(pointVel.x) > maxSurfaceVelocity.x || Math.abs(pointVel.y) > maxSurfaceVelocity.y || Math.abs(pointVel.z) > maxSurfaceVelocity.z) {
                    solveSequentially = true;
                } else {
                    break;
                }
            }
        }
        velocityOut.copyFrom(pointVel);
    }

    protected _simplexSolverExamineActivePlanes(info: SimplexSolverInfo, maxSurfaceVelocity: Vector3, velocityIn: Vector3, velocityOut: Vector3) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            switch (info.numSupportPlanes) {
                case 1: {
                    const sci = info.supportPlanes[0].constraint;
                    this._simplexSolverSolve1d(info, sci, velocityIn, velocityOut);
                    return;
                }
                case 2: {
                    const velocity = Vector3.Zero();
                    this._simplexSolverSolve1d(info, info.supportPlanes[1].constraint, velocityIn, velocity);
                    const plane0Used = this._simplexSolverSolveTest1d(info.supportPlanes[0].constraint, velocity);
                    if (!plane0Used) {
                        // Only need plane 1, so remove plane 0
                        info.supportPlanes[0].copyFrom(info.supportPlanes[1]);
                        info.numSupportPlanes = 1;
                        velocityOut.copyFrom(velocity);
                    } else {
                        this._simplexSolverSolve2d(info, maxSurfaceVelocity, info.supportPlanes[0].constraint, info.supportPlanes[1].constraint, velocityIn, velocityOut);
                    }
                    return;
                }
                case 3: {
                    // Try to drop both planes
                    {
                        const velocity = Vector3.Zero();
                        this._simplexSolverSolve1d(info, info.supportPlanes[2].constraint, velocityIn, velocityOut);

                        const plane0Used = this._simplexSolverSolveTest1d(info.supportPlanes[0].constraint, velocity);
                        if (!plane0Used) {
                            const plane1Used = this._simplexSolverSolveTest1d(info.supportPlanes[1].constraint, velocity);
                            if (!plane1Used) {
                                velocityOut.copyFrom(velocity);
                                info.supportPlanes[0].copyFrom(info.supportPlanes[2]);
                                info.numSupportPlanes = 1;
                                continue;
                            }
                        }
                    }

                    //  Try to drop plane 0 or 1
                    {
                        let droppedAPlane = false;
                        for (let testPlane = 0; testPlane < 2; testPlane++) {
                            const velocity = Vector3.Zero();
                            this._simplexSolverSolve2d(
                                info,
                                maxSurfaceVelocity,
                                info.supportPlanes[testPlane].constraint,
                                info.supportPlanes[2].constraint,
                                velocityIn,
                                velocityOut
                            );
                            const planeUsed = this._simplexSolverSolveTest1d(info.supportPlanes[1 - testPlane].constraint, velocity);
                            if (!planeUsed) {
                                info.supportPlanes[0].copyFrom(info.supportPlanes[testPlane]);
                                info.supportPlanes[1].copyFrom(info.supportPlanes[2]);
                                info.numSupportPlanes--;
                                droppedAPlane = true;
                                break;
                            }
                        }

                        if (droppedAPlane) {
                            continue;
                        }
                    }

                    // Otherwise, try and solve all three planes:
                    this._simplexSolverSolve3d(
                        info,
                        maxSurfaceVelocity,
                        info.supportPlanes[0].constraint,
                        info.supportPlanes[1].constraint,
                        info.supportPlanes[2].constraint,
                        true,
                        velocityIn,
                        velocityOut
                    );
                    return;
                }
                case 4: {
                    this._simplexSolverSortInfo(info);
                    let droppedAPlane = false;

                    for (let i = 0; i < 3; i++) {
                        const velocity = Vector3.Zero();
                        this._simplexSolverSolve3d(
                            info,
                            maxSurfaceVelocity,
                            info.supportPlanes[(i + 1) % 3].constraint,
                            info.supportPlanes[(i + 2) % 3].constraint,
                            info.supportPlanes[3].constraint,
                            false,
                            velocityIn,
                            velocity
                        );
                        const planeUsed = this._simplexSolverSolveTest1d(info.supportPlanes[i].constraint, velocity);
                        if (!planeUsed) {
                            info.supportPlanes[i].copyFrom(info.supportPlanes[2]);
                            info.supportPlanes[2].copyFrom(info.supportPlanes[3]);
                            info.numSupportPlanes = 3;
                            droppedAPlane = true;
                            break;
                        }
                    }

                    if (droppedAPlane) {
                        continue;
                    }

                    // Nothing can be dropped so we've failed to solve
                    // Now we try all 3d combinations
                    {
                        const velocity = velocityIn.clone();
                        const sci0 = info.supportPlanes[0].constraint;
                        const sci1 = info.supportPlanes[1].constraint;
                        const sci2 = info.supportPlanes[2].constraint;
                        const sci3 = info.supportPlanes[3].constraint;
                        const oldNum = info.numSupportPlanes;
                        if (oldNum == info.numSupportPlanes) {
                            this._simplexSolverSolve3d(info, maxSurfaceVelocity, sci0, sci1, sci2, false, velocity, velocity);
                            // eslint-disable-next-line no-dupe-else-if
                        } else if (oldNum == info.numSupportPlanes) {
                            this._simplexSolverSolve3d(info, maxSurfaceVelocity, sci0, sci1, sci3, false, velocity, velocity);
                            // eslint-disable-next-line no-dupe-else-if
                        } else if (oldNum == info.numSupportPlanes) {
                            this._simplexSolverSolve3d(info, maxSurfaceVelocity, sci0, sci2, sci3, false, velocity, velocity);
                            // eslint-disable-next-line no-dupe-else-if
                        } else if (oldNum == info.numSupportPlanes) {
                            this._simplexSolverSolve3d(info, maxSurfaceVelocity, sci1, sci2, sci3, false, velocity, velocity);
                        }

                        velocityOut.copyFrom(velocity);
                    }

                    //  Search a plane to drop
                    {
                        //  Search the highest penalty value
                        let maxStatus = SurfaceConstraintInteractionStatus.OK;
                        for (let i = 0; i < 4; i++) {
                            maxStatus = Math.max(maxStatus, info.supportPlanes[i].interaction.status);
                        }

                        // Remove the place with the lowest priority and the highest penalty
                        let i = 0;
                        for (; i < 4; i++) {
                            if (maxStatus == info.supportPlanes[i].interaction.status) {
                                info.supportPlanes[i].copyFrom(info.supportPlanes[3]);
                                break;
                            }
                            info.numSupportPlanes--;
                        }
                    }

                    //  Clear penalty flags for the other planes
                    for (let i = 0; i < 3; i++) {
                        info.supportPlanes[i].interaction.status = SurfaceConstraintInteractionStatus.OK;
                    }

                    continue;
                }
            }
        }
    }

    protected _simplexSolverSolve(
        constraints: ISurfaceConstraintInfo[],
        velocity: Vector3,
        deltaTime: number,
        minDeltaTime: number,
        up: Vector3,
        maxSurfaceVelocity: Vector3
    ): SimplexSolverOutput {
        const eps = 1e-6;
        const output = new SimplexSolverOutput();
        output.position = Vector3.Zero();
        output.velocity = velocity.clone();
        output.planeInteractions = [];
        let remainingTime = deltaTime;

        for (let i = 0; i < constraints.length; i++) {
            output.planeInteractions.push({
                touched: false,
                stopped: false,
                surfaceTime: 0,
                penaltyDistance: 0,
                status: SurfaceConstraintInteractionStatus.OK,
            });
        }

        const info = new SimplexSolverInfo();
        info.inputConstraints = constraints;
        info.outputInteractions = output.planeInteractions;
        info.supportPlanes[0] = new SimplexSolverActivePlanes();
        info.supportPlanes[1] = new SimplexSolverActivePlanes();
        info.supportPlanes[2] = new SimplexSolverActivePlanes();
        info.supportPlanes[3] = new SimplexSolverActivePlanes();

        while (remainingTime > 0) {
            // search for a plane which collides our current direction
            let hitIndex = -1;
            let minCollisionTime = remainingTime;
            for (let i = 0; i < constraints.length; i++) {
                //  Do not search existing active planes
                if (info.numSupportPlanes >= 1 && info.supportPlanes[0].index == i) {
                    continue;
                }
                if (info.numSupportPlanes >= 2 && info.supportPlanes[1].index == i) {
                    continue;
                }
                if (info.numSupportPlanes >= 3 && info.supportPlanes[2].index == i) {
                    continue;
                }
                if (output.planeInteractions[i].status != SurfaceConstraintInteractionStatus.OK) {
                    continue;
                }

                // Try to find the plane with the shortest time to move
                const sci = constraints[i];
                const relativeVel = this._tmpVecs[25];
                output.velocity.subtractToRef(sci.velocity, relativeVel);
                const relativeProjectedVel = -relativeVel.dot(sci.planeNormal);
                // if projected velocity is pointing away skip it
                if (relativeProjectedVel <= 0) {
                    continue;
                }

                //  Calculate the time of impact
                const relativePos = this._tmpVecs[26];
                sci.velocity.scaleToRef(info.currentTime, this._tmpVecs[27]);
                output.position.subtractToRef(this._tmpVecs[27], relativePos);
                let projectedPos = sci.planeNormal.dot(relativePos);

                // treat penetrations
                const penaltyDist = output.planeInteractions[i].penaltyDistance;
                if (penaltyDist < eps) {
                    projectedPos = 0;
                }
                projectedPos += penaltyDist;

                // check for new hit
                if (projectedPos < minCollisionTime * relativeProjectedVel) {
                    minCollisionTime = projectedPos / relativeProjectedVel;
                    hitIndex = i;
                }
            }

            //  integrate: Walk to our hitPosition we must walk more than 10 microseconds into the future to consider it valid.
            const minAcceptableCollisionTime = 1e-4;
            if (minCollisionTime > minAcceptableCollisionTime) {
                info.currentTime += minCollisionTime;
                remainingTime -= minCollisionTime;
                output.position.addInPlace(output.velocity.scale(minCollisionTime));
                for (let i = 0; i < info.numSupportPlanes; i++) {
                    info.supportPlanes[i].interaction.surfaceTime += minCollisionTime;
                    info.supportPlanes[i].interaction.touched = true;
                }

                output.deltaTime = info.currentTime;
                if (info.currentTime > minDeltaTime) {
                    return output;
                }
            }

            //  If we have no hit than we are done
            if (hitIndex < 0) {
                output.deltaTime = deltaTime;
                break;
            }

            //  Add our hit to our current list of active planes
            const supportPlane = info.supportPlanes[info.numSupportPlanes++];
            supportPlane.constraint = constraints[hitIndex];
            supportPlane.interaction = output.planeInteractions[hitIndex];
            supportPlane.interaction.penaltyDistance = (supportPlane.interaction.penaltyDistance + eps) * 2.0;
            supportPlane.index = hitIndex;

            // Move our character along the current set of active planes
            this._simplexSolverExamineActivePlanes(info, maxSurfaceVelocity, velocity, output.velocity);
        }

        return output;
    }

    /**
     * Compute a CharacterSurfaceInfo from current state and a direction
     * @param deltaTime frame delta time in seconds. When using scene.deltaTime divide by 1000.0
     * @param direction direction to check, usually gravity direction
     * @returns a CharacterSurfaceInfo object
     */
    public checkSupport(deltaTime: number, direction: Vector3): CharacterSurfaceInfo {
        const surfaceInfo = {
            isSurfaceDynamic: false,
            supportedState: CharacterSupportedState.UNSUPPORTED,
            averageSurfaceNormal: Vector3.Zero(),
            averageSurfaceVelocity: Vector3.Zero(),
            averageAngularSurfaceVelocity: Vector3.Zero(),
        };
        this.checkSupportToRef(deltaTime, direction, surfaceInfo);
        return surfaceInfo;
    }

    /**
     * Compute a CharacterSurfaceInfo from current state and a direction
     * @param deltaTime frame delta time in seconds. When using scene.deltaTime divide by 1000.0
     * @param direction direction to check, usually gravity direction
     * @param surfaceInfo output for surface info
     */
    public checkSupportToRef(deltaTime: number, direction: Vector3, surfaceInfo: CharacterSurfaceInfo): void {
        const eps = 1e-4;

        this._validateManifold();
        const constraints = this._createConstraintsFromManifold(deltaTime, 0.0);
        const storedVelocities: Vector3[] = [];
        // Remove velocities and friction to make this a query of the static geometry
        for (let i = 0; i < constraints.length; i++) {
            storedVelocities.push(constraints[i].velocity.clone());
            constraints[i].velocity.setAll(0);
        }

        const maxSurfaceVelocity = this._tmpVecs[3];
        maxSurfaceVelocity.set(this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver);
        const output = this._simplexSolverSolve(constraints, direction, deltaTime, deltaTime, this.up, maxSurfaceVelocity);

        surfaceInfo.averageSurfaceVelocity.setAll(0);
        surfaceInfo.averageAngularSurfaceVelocity.setAll(0);
        surfaceInfo.averageSurfaceNormal.setAll(0);
        surfaceInfo.isSurfaceDynamic = false;

        // If the constraints did not affect the character movement then it is unsupported and we can finish
        if (output.velocity.equalsWithEpsilon(direction, eps)) {
            surfaceInfo.supportedState = CharacterSupportedState.UNSUPPORTED;
            return;
        }

        // Check how was the input velocity modified to determine if the character is supported or sliding
        if (output.velocity.lengthSquared() < eps) {
            surfaceInfo.supportedState = CharacterSupportedState.SUPPORTED;
        } else {
            output.velocity.normalize();
            const angleSin = output.velocity.dot(direction);
            const cosSqr = 1 - angleSin * angleSin;
            if (cosSqr < this.maxSlopeCosine * this.maxSlopeCosine) {
                surfaceInfo.supportedState = CharacterSupportedState.SLIDING;
            } else {
                surfaceInfo.supportedState = CharacterSupportedState.SUPPORTED;
            }
        }

        // Add all supporting constraints to the ground information
        let numTouching = 0;
        for (let i = -0; i < constraints.length; i++) {
            if (output.planeInteractions[i].touched && constraints[i].planeNormal.dot(direction) < -0.08) {
                surfaceInfo.averageSurfaceNormal.addInPlace(constraints[i].planeNormal);
                surfaceInfo.averageSurfaceVelocity.addInPlace(storedVelocities[i]);
                surfaceInfo.averageAngularSurfaceVelocity.addInPlace(constraints[i].angularVelocity);
                numTouching++;
            }
        }

        if (numTouching > 0) {
            surfaceInfo.averageSurfaceNormal.normalize();
            surfaceInfo.averageSurfaceVelocity.scaleInPlace(1 / numTouching);
            surfaceInfo.averageAngularSurfaceVelocity.scaleInPlace(1 / numTouching);
        }

        // isSurfaceDynamic update
        if (surfaceInfo.supportedState == CharacterSupportedState.SUPPORTED) {
            for (let i = 0; i < this._manifold.length; i++) {
                const manifold = this._manifold[i];
                const bodyB = manifold.bodyB;

                if (this._manifold[i].normal.dot(direction) < -0.08 && bodyB.body.getMotionType(0) == PhysicsMotionType.DYNAMIC) {
                    surfaceInfo.isSurfaceDynamic = true;
                    break;
                }
            }
        }
    }

    protected _castWithCollectors(startPos: Vector3, endPos: Vector3, castCollector: any /*HP_CollectorId*/, startCollector?: any /*HP_CollectorId*/) {
        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;

        const startNative = [startPos.x, startPos.y, startPos.z];
        const orientation = [this._orientation.x, this._orientation.y, this._orientation.z, this._orientation.w];
        if (startCollector != null) {
            const query /*: ShapeProximityInput*/ = [
                this._shape._pluginData,
                startNative,
                orientation,
                this.keepDistance + this.keepContactTolerance, // max distance
                false, // should hit triggers
                [this._body._pluginData.hpBodyId[0]],
            ];
            hknp.HP_World_ShapeProximityWithCollector(hk.world, startCollector, query);
        }

        {
            const query /*: ShapeCastInput*/ = [
                this._shape._pluginData,
                orientation,
                startNative,
                [endPos.x, endPos.y, endPos.z],
                false, // should hit triggers
                [this._body._pluginData.hpBodyId[0]],
            ];
            hknp.HP_World_ShapeCastWithCollector(hk.world, castCollector, query);
        }
    }

    protected _resolveContacts(deltaTime: number, gravity: Vector3) {
        const eps = 1e-12;
        //<todo object interactions out
        for (let i = 0; i < this._manifold.length; i++) {
            const contact = this._manifold[i];
            const bodyB = this._manifold[i].bodyB;

            //<todo test if bodyB is another character with a proxy body

            // Skip fixed or keyframed bodies as we won't apply impulses to them
            if (bodyB.body.getMotionType(bodyB.index) != PhysicsMotionType.DYNAMIC) {
                continue;
            }

            // Calculate and apply impulse on contacted body
            {
                //<todo input/output for callbacks
                let inputObjectMassInv = 0;
                let inputObjectImpulse = 0;
                let outputObjectImpulse = Vector3.Zero();
                const outputImpulsePosition = contact.position;

                // Calculate relative normal velocity of the contact point in the contacted body
                const pointRelVel = this._tmpVecs[19];
                this._getPointVelocityToRef(bodyB, contact.position, pointRelVel);
                pointRelVel.subtractInPlace(this._velocity);
                const inputProjectedVelocity = pointRelVel.dot(contact.normal);
                const dampFactor = 0.9;

                // Change velocity
                let deltaVelocity = -inputProjectedVelocity * dampFactor;

                // Apply an extra impulse if the collision is actually penetrating
                if (contact.distance < 0) {
                    const recoveryTau = 0.4;
                    deltaVelocity += (contact.distance * recoveryTau) / deltaTime;
                }

                // Apply impulse if required to keep bodies apart
                if (deltaVelocity < 0) {
                    //  Calculate the impulse magnitude
                    const invInertia = this._getInverseInertiaWorld(bodyB);
                    const comWorld = this._tmpVecs[15];
                    this._getComWorldToRef(bodyB, comWorld);
                    const r = this._tmpVecs[16];
                    contact.position.subtractToRef(comWorld, r);
                    const jacAng = this._tmpVecs[17];
                    Vector3.CrossToRef(r, contact.normal, jacAng);
                    const rc = this._tmpVecs[18];
                    Vector3.TransformNormalToRef(jacAng, invInertia, rc);
                    inputObjectMassInv = rc.dot(jacAng) + this._getInvMass(bodyB);
                    inputObjectImpulse = deltaVelocity / inputObjectMassInv;

                    // Clamp impulse magnitude if required and apply it to the normal direction
                    const maxPushImpulse = -this.characterStrength * deltaTime;
                    if (inputObjectImpulse < maxPushImpulse) {
                        inputObjectImpulse = maxPushImpulse;
                    }
                    outputObjectImpulse = contact.normal.scale(inputObjectImpulse);
                } else {
                    inputObjectImpulse = 0;
                    inputObjectMassInv = this._getInvMass(bodyB);
                }

                // Add gravity
                {
                    // Calculate effect of gravity on the velocity of the character in the contact normal direction
                    let relVelN = contact.normal.dot(gravity.scale(deltaTime));
                    // If it is a separating contact subtract the separation velocity
                    if (inputProjectedVelocity < 0) {
                        relVelN -= inputProjectedVelocity;
                    }
                    // If the resulting velocity is negative an impulse is applied to stop the character from falling into
                    // the contacted body
                    if (relVelN < -eps) {
                        outputObjectImpulse.addInPlace(contact.normal.scale(this.characterMass * relVelN));
                    }
                }

                //<todo Fire callback to allow user to change impulse + use the info / play sounds

                const triggerCollisionInfo: ICharacterControllerCollisionEvent = {
                    collider: bodyB.body,
                    colliderIndex: bodyB.index,
                    impulse: outputObjectImpulse,
                    impulsePosition: outputImpulsePosition,
                };
                this.onTriggerCollisionObservable.notifyObservers(triggerCollisionInfo);

                bodyB.body.applyImpulse(outputObjectImpulse, outputImpulsePosition, bodyB.index);
            }
        }
    }

    protected _getInverseInertiaWorld(body: { body: PhysicsBody; index: number }): DeepImmutableObject<Matrix> {
        const mp = body.body.getMassProperties(body.index);
        if (!mp.inertia || !mp.inertiaOrientation) {
            return Matrix.IdentityReadOnly;
        }
        const invOrientation = Matrix.FromQuaternionToRef(mp.inertiaOrientation, TmpVectors.Matrix[0]).invert();
        const it = TmpVectors.Matrix[1];

        const ir = invOrientation.getRowToRef(0, TmpVectors.Vector4[0]);
        it.setRowFromFloats(0, mp.inertia.x * ir.x, mp.inertia.x * ir.y, mp.inertia.x * ir.z, 0);
        invOrientation.getRowToRef(1, ir);
        it.setRowFromFloats(0, mp.inertia.y * ir.x, mp.inertia.y * ir.y, mp.inertia.y * ir.z, 0);
        invOrientation.getRowToRef(2, ir);
        it.setRowFromFloats(0, mp.inertia.z * ir.x, mp.inertia.z * ir.y, mp.inertia.z * ir.z, 0);
        invOrientation.multiplyToRef(it, this._tmpMatrix);
        return this._tmpMatrix;
    }

    protected _getComWorldToRef(body: { body: PhysicsBody; index: number }, result: Vector3) {
        const mp = body.body.getMassProperties(body.index);
        Vector3.TransformCoordinatesToRef(mp.centerOfMass!, body.body.transformNode.getWorldMatrix(), result);
    }

    protected _getInvMass(body: { body: PhysicsBody; index: number }): number {
        return 1 / body.body.getMassProperties(body.index).mass!;
    }

    protected _integrateManifolds(deltaTime: number, gravity: Vector3): void {
        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const epsSqrd = 1e-8;

        let newVelocity = Vector3.Zero();
        let remainingTime = deltaTime;

        // Make sure that contact with bodies that have been removed since the call to checkSupport() are removed from the
        // manifold
        this._validateManifold();

        for (let iter = 0; iter < this.maxCastIterations && remainingTime > 1e-5; iter++) {
            this._castWithCollectors(this._position, this._position.add(this._lastDisplacement), this._castCollector, this._startCollector);
            const updateResult = this._updateManifold(this._startCollector, this._castCollector, this._lastDisplacement);

            // Create surface constraints from the manifold contacts.
            const constraints = this._createConstraintsFromManifold(deltaTime, deltaTime - remainingTime);
            const maxSurfaceVelocity = this._tmpVecs[3];
            maxSurfaceVelocity.set(this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver);
            const minDeltaTime = this._velocity.lengthSquared() == 0 ? 0.0 : (0.5 * this.keepDistance) / this._velocity.length();
            const solveResults = this._simplexSolverSolve(constraints, this._velocity, remainingTime, minDeltaTime, this.up, maxSurfaceVelocity);
            const newDisplacement = solveResults.position;
            const solverDeltaTime = solveResults.deltaTime;
            newVelocity = solveResults.velocity;

            this._resolveContacts(deltaTime, gravity);

            let newContactIndex = -1;
            // todo if (updateResult == hit multiple bodies) ... cast again

            // If castCollector had hits on different bodies (so we're not sure if some non-closest body could be in our way) OR
            // the simplex has given an output direction different from the cast guess
            // we re-cast to check we can move there. There is no need to get the start points again.
            if (updateResult != 0 || (newDisplacement.lengthSquared() > epsSqrd && !this._lastDisplacement.equalsWithEpsilon(newDisplacement, this._displacementEps))) {
                this._castWithCollectors(this._position, this._position.add(newDisplacement), this._castCollector, this._startCollector);
                const hknp = hk._hknp;
                const numCastHits = hknp.HP_QueryCollector_GetNumHits(this._castCollector)[1];
                // Find the first contact that isn't already in the manifold
                if (numCastHits > 0) {
                    //<todo sortHits()
                    for (let i = 0; i < numCastHits; i++) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const [fraction, _hitLocal, hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(this._castCollector, i)[1];
                        const newContact = ContactFromCast(hk, hitWorld, newDisplacement, fraction, this.keepDistance);
                        if (this._findContact(newContact, this._manifold, 0.1) == -1) {
                            //<todo fireContactAdded
                            newContactIndex = this._manifold.length;
                            this._manifold.push(newContact);
                            //<todo updateTriggersSeen()
                            break;
                        }
                    }
                }
            }

            if (newContactIndex >= 0) {
                const newContact = this._manifold[newContactIndex];
                const displacementLengthInv = 1.0 / newDisplacement.length();
                const angleBetweenMovementAndSurface = newDisplacement.dot(newContact.normal) * displacementLengthInv;
                const keepDistanceAlongMovement = this.keepDistance / -angleBetweenMovementAndSurface;
                const distance = newContact.fraction;
                let fraction = distance - keepDistanceAlongMovement * displacementLengthInv;
                fraction = Math.min(Math.max(fraction, 0.0), 1.0);

                const displacement = newDisplacement.scale(fraction);
                this._position.addInPlace(displacement);
                remainingTime -= solverDeltaTime * fraction;
            } else {
                this._position.addInPlace(newDisplacement);
                remainingTime -= solverDeltaTime;
            }
            this._lastDisplacement.copyFrom(newDisplacement);
        }

        this._velocity.copyFrom(newVelocity);
        this._transformNode.position.copyFrom(this._position);
    }

    /**
     * Move the character with collisions
     * @param displacement defines the requested displacement vector
     */
    public moveWithCollisions(displacement: Vector3): void {
        if (this._scene.deltaTime == undefined) {
            return;
        }
        const deltaTime = this._scene.deltaTime / 1000.0;
        const invDeltaTime = 1 / deltaTime;

        displacement.scaleToRef(1 / deltaTime, this._velocity);
        this._lastDisplacement.copyFrom(displacement);

        this._lastVelocity.copyFrom(this._velocity);
        this._lastInvDeltaTime = invDeltaTime;

        this._integrateManifolds(deltaTime, Vector3.ZeroReadOnly);
    }

    /**
     * Update internal state. Must be called once per frame
     * @param deltaTime frame delta time in seconds. When using scene.deltaTime divide by 1000.0
     * @param surfaceInfo surface information returned by checkSupport
     * @param gravity gravity applied to the character. Can be different that world gravity
     */
    public integrate(deltaTime: number, surfaceInfo: CharacterSurfaceInfo, gravity: Vector3) {
        const invDeltaTime = 1 / deltaTime;
        const remainingTime = deltaTime;

        // Choose the first cast direction.  If velocity hasn't changed from the previous integrate, guess that the
        // displacement will be the same as last integrate, scaled by relative step length.  Otherwise, guess based
        // on current velocity.
        {
            const tolerance = this._displacementEps * invDeltaTime;
            if (this._velocity.equalsWithEpsilon(this._lastVelocity, tolerance)) {
                this._lastDisplacement.scaleInPlace(remainingTime * this._lastInvDeltaTime);
            } else {
                const displacementVelocity = this._velocity;
                if (surfaceInfo.supportedState == CharacterSupportedState.SUPPORTED) {
                    const relativeVelocity = this._tmpVecs[28];
                    this._velocity.subtractToRef(surfaceInfo.averageSurfaceVelocity, relativeVelocity);
                    const normalDotVelocity = surfaceInfo.averageSurfaceNormal.dot(relativeVelocity);
                    if (normalDotVelocity < 0) {
                        relativeVelocity.subtractInPlace(surfaceInfo.averageSurfaceNormal.scale(normalDotVelocity));
                        displacementVelocity.copyFrom(relativeVelocity);
                        displacementVelocity.addInPlace(surfaceInfo.averageSurfaceVelocity);
                    }
                }
                this._lastDisplacement.copyFrom(displacementVelocity);
                this._lastDisplacement.scaleInPlace(remainingTime);
            }
            this._lastVelocity.copyFrom(this._velocity);
            this._lastInvDeltaTime = invDeltaTime;
        }

        this._integrateManifolds(deltaTime, gravity);
    }

    /**
     * Helper function to calculate velocity based on surface informations and current velocity state and target
     * @param deltaTime frame delta time in seconds. When using scene.deltaTime divide by 1000.0
     * @param forwardWorld character forward in world coordinates
     * @param surfaceNormal surface normal direction
     * @param currentVelocity current velocity
     * @param surfaceVelocity velocity induced by the surface
     * @param desiredVelocity desired character velocity
     * @param upWorld up vector in world space
     * @param result resulting velocity vector
     * @returns boolean true if result has been computed
     */
    public calculateMovementToRef(
        deltaTime: number,
        forwardWorld: Vector3,
        surfaceNormal: Vector3,
        currentVelocity: Vector3,
        surfaceVelocity: Vector3,
        desiredVelocity: Vector3,
        upWorld: Vector3,
        result: Vector3
    ): boolean {
        const eps = 1e-5;
        let binorm = forwardWorld.cross(upWorld);
        if (binorm.lengthSquared() < eps) {
            return false;
        }
        binorm.normalize();
        const tangent = binorm.cross(surfaceNormal);
        tangent.normalize();
        binorm = tangent.cross(surfaceNormal);
        binorm.normalize();

        const surfaceFrame = Matrix.FromValues(
            tangent.x,
            tangent.y,
            tangent.z,
            0,
            binorm.x,
            binorm.y,
            binorm.z,
            0,
            surfaceNormal.x,
            surfaceNormal.y,
            surfaceNormal.z,
            0,
            0,
            0,
            0,
            1
        );
        const invSurfaceFrame = surfaceFrame.clone().invert();

        currentVelocity.subtractToRef(surfaceVelocity, this._tmpVecs[29]);
        const relative = this._tmpVecs[30];
        Vector3.TransformNormalToRef(this._tmpVecs[29], invSurfaceFrame, relative);

        const sideVec = upWorld.cross(forwardWorld);
        const fwd = desiredVelocity.dot(forwardWorld);
        const side = desiredVelocity.dot(sideVec);
        const len = desiredVelocity.length();

        const desiredVelocitySF = this._tmpVecs[4];
        desiredVelocitySF.set(-fwd, side, 0);
        desiredVelocitySF.normalize();
        desiredVelocitySF.scaleInPlace(len);
        const diff = this._tmpVecs[5];
        desiredVelocitySF.subtractToRef(relative, diff);

        // Clamp it by maxAcceleration and limit it by gain.
        {
            const lenSq = diff.lengthSquared();
            const maxVelocityDelta = this.maxAcceleration * deltaTime;
            let tmp: number;
            if (lenSq * this.acceleration * this.acceleration > maxVelocityDelta * maxVelocityDelta) {
                tmp = maxVelocityDelta / Math.sqrt(lenSq);
            } else {
                tmp = this.acceleration;
            }
            diff.scaleInPlace(tmp);
        }

        relative.addInPlace(diff);

        // Transform back to world space and apply
        Vector3.TransformNormalToRef(relative, surfaceFrame, result);

        // Add back in the surface velocity
        result.addInPlace(surfaceVelocity);
        return true;
    }

    /**
     * Helper function to calculate velocity based on surface informations and current velocity state and target
     * @param deltaTime frame delta time in seconds. When using scene.deltaTime divide by 1000.0
     * @param forwardWorld character forward in world coordinates
     * @param surfaceNormal surface normal direction
     * @param currentVelocity current velocity
     * @param surfaceVelocity velocity induced by the surface
     * @param desiredVelocity desired character velocity
     * @param upWorld up vector in world space
     * @returns a new velocity vector
     */
    public calculateMovement(
        deltaTime: number,
        forwardWorld: Vector3,
        surfaceNormal: Vector3,
        currentVelocity: Vector3,
        surfaceVelocity: Vector3,
        desiredVelocity: Vector3,
        upWorld: Vector3
    ): Vector3 {
        const result = new Vector3(0, 0, 0);
        this.calculateMovementToRef(deltaTime, forwardWorld, surfaceNormal, currentVelocity, surfaceVelocity, desiredVelocity, upWorld, result);
        return result;
    }
}
