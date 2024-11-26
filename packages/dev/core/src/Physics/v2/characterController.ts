import { Vector3, Quaternion, Matrix, TmpVectors } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import type { DeepImmutableObject } from "../../types";
import type { PhysicsBody } from "./physicsBody";
import type { PhysicsShape } from "./physicsShape";
import { PhysicsMotionType } from "./IPhysicsEnginePlugin";
import type { HavokPlugin } from "./Plugins/havokPlugin";

export enum CharacterSupportedState {
    UNSUPPORTED,
    SLIDING,
    SUPPORTED,
}

/**
 *
 */
export class CharacterSurfaceInfo {
    /**
     *
     */
    public isSurfaceDynamic: boolean;
    /**
     *
     */
    public supportedState: CharacterSupportedState;
    /**
     *
     */
    public averageSurfaceNormal: Vector3;
    /**
     *
     */
    public averageSurfaceVelocity: Vector3;
    /**
     *
     */
    public averageAngularSurfaceVelocity: Vector3;
}

class Contact {
    /**
     *
     */
    public position: Vector3;
    /**
     *
     */
    public normal: Vector3;
    /**
     *
     */
    public distance: number;
    /**
     *
     */
    public fraction: number;
    /**
     *
     */
    public bodyB: { body: PhysicsBody; index: number };
    /**
     *
     */
    public allowedPenetration: number;

    /**
     *
     * @param hp
     * @param cp
     * @param hitDistance
     * @param keepDistance
     * @returns
     */
    static FromProximity(hp: HavokPlugin, cp: any /*ContactPoint*/, hitDistance: number, keepDistance: number): Contact {
        //@ts-ignore
        const bodyMap = hp._bodies;
        return {
            position: Vector3.FromArray(cp[3]),
            normal: Vector3.FromArray(cp[4]),
            distance: hitDistance,
            fraction: 0,
            bodyB: bodyMap.get(cp[0][0])!,
            allowedPenetration: Math.min(Math.max(keepDistance - hitDistance, 0.0), keepDistance),
        };
    }

    /**
     *
     * @param hp
     * @param cp
     * @param castPath
     * @param hitFraction
     * @param keepDistance
     * @returns
     */
    static FromCast(hp: HavokPlugin, cp: any /*ContactPoint*/, castPath: Vector3, hitFraction: number, keepDistance: number): Contact {
        //@ts-ignore
        const bodyMap = hp._bodies;

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
}

class SurfaceConstraintInfo {
    /**
     *
     */
    public planeNormal: Vector3;
    /**
     *
     */
    public planeDistance: number;
    /**
     *
     */
    public velocity: Vector3;
    /**
     *
     */
    public angularVelocity: Vector3;
    /**
     *
     */
    public staticFriction: number;
    /**
     *
     */
    public extraUpStaticFriction: number;
    /**
     *
     */
    public extraDownStaticFriction: number;
    /**
     *
     */
    public dynamicFriction: number;
    /**
     *
     */
    public priority: number;
}

const enum SurfaceConstraintInteractionStatus {
    OK,
    FAILURE_3D,
    FAILURE_2D,
}

class SurfaceConstraintInteraction {
    /**
     *
     */
    public touched: boolean = false;
    /**
     *
     */
    public stopped: boolean = false;
    /**
     *
     */
    public surfaceTime: number = 0;
    /**
     *
     */
    public penaltyDistance: number = 0;
    /**
     *
     */
    public status: SurfaceConstraintInteractionStatus = SurfaceConstraintInteractionStatus.OK;
}

class SimplexSolverOutput {
    /**
     *
     */
    public position: Vector3;
    /**
     *
     */
    public velocity: Vector3;
    /**
     *
     */
    public deltaTime: number;
    /**
     *
     */
    public planeInteractions: SurfaceConstraintInteraction[];
}

class SimplexSolverActivePlanes {
    /**
     *
     */
    public index: number;
    /**
     *
     */
    public constraint: SurfaceConstraintInfo;
    /**
     *
     */
    public interaction: SurfaceConstraintInteraction;

    /**
     *
     * @param other
     */
    public copyFrom(other: SimplexSolverActivePlanes) {
        this.index = other.index;
        this.constraint = other.constraint;
        this.interaction = other.interaction;
    }
}

class SimplexSolverInfo {
    /**
     *
     */
    public supportPlanes: Array<SimplexSolverActivePlanes> = new Array<SimplexSolverActivePlanes>(4);
    /**
     *
     */
    public numSupportPlanes: number = 0;
    /**
     *
     */
    public currentTime: number = 0;
    /**
     *
     */
    public inputConstraints: SurfaceConstraintInfo[];
    /**
     *
     */
    public outputInteractions: SurfaceConstraintInteraction[];

    /**
     *
     * @param constraint
     * @returns
     */
    public getOutput(constraint: SurfaceConstraintInfo): SurfaceConstraintInteraction {
        return this.outputInteractions[this.inputConstraints.indexOf(constraint)]; //<todo.eoin This is O(1) in C++! Equivalent in TS?
    }
}

/**
 *
 */
export class PhysicsCharacterController {
    private _position: Vector3;
    private _orientation: Quaternion = Quaternion.Identity();
    private _velocity: Vector3;
    private _lastVelocity: Vector3;
    private _shape: PhysicsShape;
    private _manifold: Contact[] = [];
    private _lastDisplacement: Vector3;
    private _contactAngleSensitivity = 10.0;
    private _lastInvDeltaTime: number;
    private _scene: Scene;
    private _tmpMatrix = new Matrix();
    /**
     *
     */
    public keepDistance: number = 0.05;
    /**
     *
     */
    public keepContactTolerance: number = 0.1;
    /**
     *
     */
    public maxCastIterations: number = 10;
    /**
     *
     */
    public penetrationRecoverySpeed = 1.0;
    /**
     *
     */
    public staticFriction = 0;
    /**
     *
     */
    public dynamicFriction = 1;
    /**
     *
     */
    public maxSlopeCosine = Math.cos(Math.PI * (60.0 / 180.0));
    /**
     *
     */
    public maxCharacterSpeedForSolver = 10.0;
    /**
     *
     */
    public up = new Vector3(0, 1, 0);
    /**
     *
     */
    public characterStrength = 1e38;
    /**
     *
     */
    public characterMass = 0;
    private _startCollector;
    private _castCollector;

    /**
     * instanciate a new characterController
     * @param position
     * @param shape
     * @param scene
     */
    public constructor(position: Vector3, shape: PhysicsShape, scene: Scene) {
        this._position = position.clone();
        this._velocity = Vector3.Zero();
        this._lastVelocity = Vector3.Zero();
        this._shape = shape;
        this._lastInvDeltaTime = 1.0 / 60.0;
        this._lastDisplacement = Vector3.Zero();
        this._scene = scene;

        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;

        this._startCollector = hknp.HP_QueryCollector_Create(16)[1];
        this._castCollector = hknp.HP_QueryCollector_Create(16)[1];
    }

    /**
     *
     * @returns
     */
    public getPosition(): Vector3 {
        return this._position;
    }

    /**
     *
     * @returns
     */
    public getVelocity(): Vector3 {
        return this._velocity;
    }

    /**
     *
     * @param v
     */
    public setVelocity(v: Vector3) {
        this._velocity.copyFrom(v);
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

    private _getPointVelocity(body: { body: PhysicsBody; index: number }, pointWorld: Vector3) {
        //<todo does this really not exist in body interface?
        const comWorld = this._getComWorld(body);
        const relPos = pointWorld.subtract(comWorld);
        const av = body.body.getAngularVelocity(body.index);
        const arm = av.cross(relPos);
        return arm.add(body.body.getLinearVelocity(body.index));
    }

    protected _compareContacts(contactA: Contact, contactB: Contact): number {
        const angSquared = (1.0 - contactA.normal.dot(contactB.normal)) * this._contactAngleSensitivity * this._contactAngleSensitivity;
        const planeDistSquared = (contactA.distance - contactB.distance) * (contactA.distance * contactB.distance);

        const p1Vel = this._getPointVelocity(contactA.bodyB, contactA.position);
        const p2Vel = this._getPointVelocity(contactB.bodyB, contactB.position);
        const velocityDiffSquared = p1Vel.subtract(p2Vel).lengthSquared();

        const fitness = angSquared * 10.0 + velocityDiffSquared * 0.1 + planeDistSquared;
        return fitness;
    }

    protected _findContact(referenceContact: Contact, contactList: Contact[], threshold: number) {
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

    /**
     *
     * @param startCollector
     * @param castCollector
     * @param castPath
     * @returns
     */
    public updateManifold(startCollector: any /*HP_CollectorId*/, castCollector: any /*HP_CollectorId*/, castPath: Vector3): number {
        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;

        const numProximityHits = hknp.HP_QueryCollector_GetNumHits(startCollector)[1];
        if (numProximityHits > 0) {
            const newContacts: Contact[] = [];
            let minDistance = 1e38;
            for (let i = 0; i < numProximityHits; i++) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [distance, _contactLocal, contactWorld] = hknp.HP_QueryCollector_GetShapeProximityResult(startCollector, i)[1];
                minDistance = Math.min(minDistance, distance);
                newContacts.push(Contact.FromProximity(hk, contactWorld, distance, this.keepDistance));
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [fraction, _hitLocal, hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(castCollector, i)[1];
                if (closestHitBody == null) {
                    const contact = Contact.FromCast(hk, hitWorld, castPath, fraction, this.keepDistance);
                    closestHitBody = hitWorld[0][0];
                    const bestMatch = this._findContact(contact, this._manifold, 0.1);
                    if (bestMatch == -1) {
                        this._manifold.push(contact);
                    }

                    if (contact.bodyB.body.getMotionType(contact.bodyB.index) == PhysicsMotionType.STATIC) {
                        // The closest body is static, so it cannot move away from CC and we don't need to look any further.
                        break;
                    }
                } else if (hitWorld[0] != closestHitBody._pluginData.hpBodyId) {
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
                if (fitness < 0.1) break;
            }
            if (e2 >= 0) {
                this._manifold.slice(e1, 1);
            }
        }

        return numHitBodies;
    }

    protected _createSurfaceConstraint(contact: Contact, timeTravelled: number): SurfaceConstraintInfo {
        const constraint = new SurfaceConstraintInfo();

        //let distance = contact.distance - this.keepDistance;
        constraint.planeNormal = contact.normal.clone();
        constraint.planeDistance = contact.distance;
        constraint.staticFriction = this.staticFriction;
        constraint.dynamicFriction = this.dynamicFriction;
        constraint.extraUpStaticFriction = 0;
        constraint.extraDownStaticFriction = 0;
        constraint.velocity = Vector3.Zero();
        constraint.angularVelocity = Vector3.Zero();
        constraint.priority = 0;

        const maxSlopeCosEps = 0.1;
        const maxSlopeCosine = Math.max(this.maxSlopeCosine, maxSlopeCosEps);
        const normalDotUp = contact.normal.dot(this.up);

        const contactPosition = contact.position.clone();
        if (normalDotUp > maxSlopeCosine) {
            const com = this.getPosition();
            const contactArm = contact.position.subtract(com);
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
            constraint.priority = 1;
        }

        return constraint;
    }

    protected _addMaxSlopePlane(maxSlopeCos: number, up: Vector3, index: number, constraints: SurfaceConstraintInfo[], allowedPenetration: number): boolean {
        const verticalComponent = constraints[index].planeNormal.dot(up);
        if (verticalComponent > 0.01 && verticalComponent < maxSlopeCos) {
            const newConstraint = new SurfaceConstraintInfo();
            newConstraint.planeNormal = constraints[index].planeNormal.clone();
            newConstraint.planeDistance = constraints[index].planeDistance;
            newConstraint.velocity = constraints[index].velocity.clone();
            newConstraint.angularVelocity = constraints[index].angularVelocity.clone();
            newConstraint.priority = constraints[index].priority;
            newConstraint.dynamicFriction = constraints[index].dynamicFriction;
            newConstraint.staticFriction = constraints[index].staticFriction;
            newConstraint.extraDownStaticFriction = constraints[index].extraDownStaticFriction;
            newConstraint.extraUpStaticFriction = constraints[index].extraUpStaticFriction;
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

    protected _resolveConstraintPenetration(constraint: SurfaceConstraintInfo, penetrationRecoverySpeed: number) {
        // If penetrating we add extra velocity to push the character back out
        const eps = 1e-6;
        if (constraint.planeDistance < -eps) {
            constraint.velocity.subtractInPlace(constraint.planeNormal.scale(constraint.planeDistance * penetrationRecoverySpeed));
        }
    }

    protected _createConstraintsFromManifold(dt: number, timeTravelled: number): SurfaceConstraintInfo[] {
        const constraints = [];
        for (let i = 0; i < this._manifold.length; i++) {
            const surfaceConstraint = this._createSurfaceConstraint(this._manifold[i], timeTravelled);
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

    protected _simplexSolverSolve1d(info: SimplexSolverInfo, sci: SurfaceConstraintInfo, velocityIn: Vector3, velocityOut: Vector3) {
        const eps = 1e-5;
        const groundVelocity = sci.velocity;
        const relativeVelocity = velocityIn.subtract(groundVelocity);
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

    protected _simplexSolverSolveTest1d(sci: SurfaceConstraintInfo, velocityIn: Vector3): boolean {
        const eps = 1e-3;
        const relativeVelocity = velocityIn.subtract(sci.velocity);
        return relativeVelocity.dot(sci.planeNormal) < -eps;
    }

    protected _simplexSolverSolve2d(
        info: SimplexSolverInfo,
        maxSurfaceVelocity: Vector3,
        sci0: SurfaceConstraintInfo,
        sci1: SurfaceConstraintInfo,
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

                const t = new Vector3(0.5 * axis.dot(sVel), sci0.planeNormal.dot(sci0.velocity), sci1.planeNormal.dot(sci1.velocity));
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
        const relativeVelocity = velocityIn.subtract(groundVelocity);

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
        sci0: SurfaceConstraintInfo,
        sci1: SurfaceConstraintInfo,
        sci2: SurfaceConstraintInfo,
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

                const t = new Vector3(sci0.planeNormal.dot(sci0.velocity), sci1.planeNormal.dot(sci1.velocity), sci2.planeNormal.dot(sci2.velocity));
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

    public _simplexSolverSolve(
        constraints: SurfaceConstraintInfo[],
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
            output.planeInteractions.push(new SurfaceConstraintInteraction());
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
                if (info.numSupportPlanes >= 1 && info.supportPlanes[0].index == i) continue;
                if (info.numSupportPlanes >= 2 && info.supportPlanes[1].index == i) continue;
                if (info.numSupportPlanes >= 3 && info.supportPlanes[2].index == i) continue;
                if (output.planeInteractions[i].status != SurfaceConstraintInteractionStatus.OK) {
                    continue;
                }

                // Try to find the plane with the shortest time to move
                const sci = constraints[i];
                const relativeVel = output.velocity.subtract(sci.velocity);
                const relativeProjectedVel = -relativeVel.dot(sci.planeNormal);
                // if projected velocity is pointing away skip it
                if (relativeProjectedVel <= 0) {
                    continue;
                }

                //  Calculate the time of impact
                const relativePos = output.position.subtract(sci.velocity.scale(info.currentTime));
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
     *
     * @param deltaTime
     * @param direction
     * @returns
     */
    public checkSupport(deltaTime: number, direction: Vector3): CharacterSurfaceInfo {
        const eps = 1e-4;

        this._validateManifold();
        const constraints = this._createConstraintsFromManifold(deltaTime, 0.0);
        const storedVelocities: Vector3[] = [];
        // Remove velocities and friction to make this a query of the static geometry
        for (let i = 0; i < constraints.length; i++) {
            storedVelocities.push(constraints[i].velocity.clone());
            constraints[i].velocity.setAll(0);
        }

        const maxSurfaceVelocity = new Vector3(this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver);
        const output = this._simplexSolverSolve(constraints, direction, deltaTime, deltaTime, this.up, maxSurfaceVelocity);

        const ground = new CharacterSurfaceInfo();
        ground.averageSurfaceVelocity = Vector3.Zero();
        ground.averageAngularSurfaceVelocity = Vector3.Zero();
        ground.averageSurfaceNormal = Vector3.Zero();

        // If the constraints did not affect the character movement then it is unsupported and we can finish
        if (output.velocity.equalsWithEpsilon(direction, eps)) {
            ground.supportedState = CharacterSupportedState.UNSUPPORTED;
            return ground;
        }

        // Check how was the input velocity modified to determine if the character is supported or sliding
        if (output.velocity.lengthSquared() < eps) {
            ground.supportedState = CharacterSupportedState.SUPPORTED;
        } else {
            output.velocity.normalize();
            const angleSin = output.velocity.dot(direction);
            const cosSqr = 1 - angleSin * angleSin;
            if (cosSqr < this.maxSlopeCosine * this.maxSlopeCosine) {
                ground.supportedState = CharacterSupportedState.SLIDING;
            } else {
                ground.supportedState = CharacterSupportedState.SUPPORTED;
            }
        }

        // Add all supporting constraints to the ground information
        let numTouching = 0;
        for (let i = -0; i < constraints.length; i++) {
            if (output.planeInteractions[i].touched && constraints[i].planeNormal.dot(direction) < -0.08) {
                ground.averageSurfaceNormal.addInPlace(constraints[i].planeNormal);
                ground.averageSurfaceVelocity.addInPlace(storedVelocities[i]);
                ground.averageAngularSurfaceVelocity.addInPlace(constraints[i].angularVelocity);
                numTouching++;
            }
        }

        if (numTouching > 0) {
            ground.averageSurfaceNormal.normalize();
            ground.averageSurfaceVelocity.scaleInPlace(1 / numTouching);
            ground.averageAngularSurfaceVelocity.scaleInPlace(1 / numTouching);
        }

        return ground;
    }

    protected _castWithCollectors(startPos: Vector3, endPos: Vector3, castCollector: any /*HP_CollectorId*/, startCollector?: any /*HP_CollectorId*/) {
        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;
        const hknp = hk._hknp;

        const startNative = [startPos.x, startPos.y, startPos.z];
        const orientation = [this._orientation.x, this._orientation.y, this._orientation.z, this._orientation.w];
        if (startCollector != null) {
            const query /*: ShapeProximityInput*/ = [
                this._shape._pluginData,
                //@ts-ignore
                startNative,
                //@ts-ignore
                orientation,
                this.keepDistance + this.keepContactTolerance, // max distance
                false, // should hit triggers
                [BigInt(0)], // body to ignore //<todo allow for a proxy body!
            ];
            hknp.HP_World_ShapeProximityWithCollector(hk.world, startCollector, query);
        }

        {
            const query /*: ShapeCastInput*/ = [
                this._shape._pluginData,
                //@ts-ignore
                orientation,
                //@ts-ignore
                startNative,
                [endPos.x, endPos.y, endPos.z],
                false, // should hit triggers
                [BigInt(0)], // body to ignore //<todo allow for proxy body
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
                const pointRelVel = this._getPointVelocity(bodyB, contact.position).subtract(this._velocity);
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
                    const comWorld = this._getComWorld(bodyB);
                    const r = contact.position.subtract(comWorld);
                    const jacAng = r.cross(contact.normal);
                    const rc = Vector3.TransformNormal(jacAng, invInertia);
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

    protected _getComWorld(body: { body: PhysicsBody; index: number }): Vector3 {
        const mp = body.body.getMassProperties(body.index);
        return Vector3.TransformCoordinates(mp.centerOfMass!, body.body.transformNode.getWorldMatrix());
    }

    protected _getInvMass(body: { body: PhysicsBody; index: number }): number {
        return 1 / body.body.getMassProperties(body.index).mass!;
    }

    /**
     *
     * @param deltaTime
     * @param surfaceInfo
     * @param gravity
     */
    public integrate(deltaTime: number, surfaceInfo: CharacterSurfaceInfo, gravity: Vector3) {
        const hk = this._scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin;

        const invDeltaTime = 1 / deltaTime;
        let remainingTime = deltaTime;
        let newVelocity = Vector3.Zero();

        // If the difference between the cast displacement and the simplex solver output position is less than this
        // value (per component), do not do a second cast to check if it's possible to reach the output position.
        const displacementEps = 1e-4;
        const epsSqrd = 1e-8;

        // Choose the first cast direction.  If velocity hasn't changed from the previous integrate, guess that the
        // displacement will be the same as last integrate, scaled by relative step length.  Otherwise, guess based
        // on current velocity.
        {
            const tolerance = displacementEps * invDeltaTime;
            if (this._velocity.equalsWithEpsilon(this._lastVelocity, tolerance)) {
                this._lastDisplacement.scaleInPlace(remainingTime * this._lastInvDeltaTime);
            } else {
                const displacementVelocity = this._velocity;
                if (surfaceInfo.supportedState == CharacterSupportedState.SUPPORTED) {
                    const relativeVelocity = this._velocity.subtract(surfaceInfo.averageSurfaceVelocity);
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

        // Make sure that contact with bodies that have been removed since the call to checkSupport() are removed from the
        // manifold
        this._validateManifold();

        for (let iter = 0; iter < this.maxCastIterations && remainingTime > 1e-5; iter++) {
            this._castWithCollectors(this._position, this._position.add(this._lastDisplacement), this._castCollector, this._startCollector);
            const updateResult = this.updateManifold(this._startCollector, this._castCollector, this._lastDisplacement);

            // Create surface constraints from the manifold contacts.
            const constraints = this._createConstraintsFromManifold(deltaTime, deltaTime - remainingTime);
            const maxSurfaceVelocity = new Vector3(this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver);
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
            if (updateResult != 0 || (newDisplacement.lengthSquared() > epsSqrd && !this._lastDisplacement.equalsWithEpsilon(newDisplacement, displacementEps))) {
                this._castWithCollectors(this._position, this._position.add(newDisplacement), this._castCollector, this._startCollector);
                const hknp = hk._hknp;
                const numCastHits = hknp.HP_QueryCollector_GetNumHits(this._castCollector)[1];
                // Find the first contact that isn't already in the manifold
                if (numCastHits > 0) {
                    //<todo sortHits()
                    for (let i = 0; i < numCastHits; i++) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const [fraction, _hitLocal, hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(this._castCollector, i)[1];
                        const newContact = Contact.FromCast(hk, hitWorld, newDisplacement, fraction, this.keepDistance);
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
    }
}
