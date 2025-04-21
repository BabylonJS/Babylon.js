import type { IPhysicsEnabledObject } from "../physicsImpostor";
import { PhysicsImpostor } from "../physicsImpostor";
import type { IMotorEnabledJoint, DistanceJointData, SpringJointData } from "../physicsJoint";
import { PhysicsJoint } from "../physicsJoint";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import { Vector3, Quaternion } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import { Logger } from "../../../Misc/logger";
import { PhysicsRaycastResult } from "../../physicsRaycastResult";
import type { IPhysicsEnginePlugin, PhysicsImpostorJoint } from "../IPhysicsEnginePlugin";
import { Epsilon } from "../../../Maths/math.constants";

declare let OIMO: any;

/** @internal */
export class OimoJSPlugin implements IPhysicsEnginePlugin {
    public world: any;
    public name: string = "OimoJSPlugin";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public BJSOIMO: any;
    private _raycastResult: PhysicsRaycastResult;
    private _fixedTimeStep: number = 1 / 60;

    constructor(
        private _useDeltaForWorldStep: boolean = true,
        iterations?: number,
        oimoInjection = OIMO
    ) {
        this.BJSOIMO = oimoInjection;
        this.world = new this.BJSOIMO.World({
            iterations: iterations,
        });
        this.world.clear();
        this._raycastResult = new PhysicsRaycastResult();
    }

    /**
     *
     * @returns plugin version
     */
    public getPluginVersion(): number {
        return 1;
    }

    public setGravity(gravity: Vector3) {
        this.world.gravity.set(gravity.x, gravity.y, gravity.z);
    }

    public setTimeStep(timeStep: number) {
        this.world.timeStep = timeStep;
    }

    public getTimeStep(): number {
        return this.world.timeStep;
    }

    private _tmpImpostorsArray: Array<PhysicsImpostor> = [];

    public executeStep(delta: number, impostors: Array<PhysicsImpostor>) {
        for (const impostor of impostors) {
            impostor.beforeStep();
        }

        this.world.timeStep = this._useDeltaForWorldStep ? delta : this._fixedTimeStep;
        this.world.step();

        for (const impostor of impostors) {
            impostor.afterStep();
            //update the ordered impostors array
            this._tmpImpostorsArray[impostor.uniqueId] = impostor;
        }

        //check for collisions
        let contact = this.world.contacts;

        while (contact !== null) {
            if (contact.touching && !contact.body1.sleeping && !contact.body2.sleeping) {
                contact = contact.next;
                continue;
            }
            //is this body colliding with any other? get the impostor
            const mainImpostor = this._tmpImpostorsArray[+contact.body1.name];
            const collidingImpostor = this._tmpImpostorsArray[+contact.body2.name];

            if (!mainImpostor || !collidingImpostor) {
                contact = contact.next;
                continue;
            }

            mainImpostor.onCollide({ body: collidingImpostor.physicsBody, point: null, distance: 0, impulse: 0, normal: null });
            collidingImpostor.onCollide({ body: mainImpostor.physicsBody, point: null, distance: 0, impulse: 0, normal: null });
            contact = contact.next;
        }
    }

    public applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
        const mass = impostor.physicsBody.mass;
        impostor.physicsBody.applyImpulse(contactPoint.scale(this.world.invScale), force.scale(this.world.invScale * mass));
    }
    public applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
        Logger.Warn("Oimo doesn't support applying force. Using impulse instead.");
        this.applyImpulse(impostor, force, contactPoint);
    }
    public generatePhysicsBody(impostor: PhysicsImpostor) {
        //parent-child relationship. Does this impostor has a parent impostor?
        if (impostor.parent) {
            if (impostor.physicsBody) {
                this.removePhysicsBody(impostor);
                //TODO is that needed?
                impostor.forceUpdate();
            }
            return;
        }

        if (impostor.isBodyInitRequired()) {
            const bodyConfig: any = {
                name: impostor.uniqueId,
                //Oimo must have mass, also for static objects.
                config: [impostor.getParam("mass") || 0.001, impostor.getParam("friction"), impostor.getParam("restitution")],
                size: [],
                type: [],
                pos: [],
                posShape: [],
                rot: [],
                rotShape: [],
                move: impostor.getParam("mass") !== 0,
                density: impostor.getParam("mass"),
                friction: impostor.getParam("friction"),
                restitution: impostor.getParam("restitution"),
                //Supporting older versions of Oimo
                world: this.world,
            };

            const impostors = [impostor];
            const addToArray = (parent: IPhysicsEnabledObject) => {
                if (!parent.getChildMeshes) {
                    return;
                }
                const meshes = parent.getChildMeshes();
                for (const m of meshes) {
                    if (m.physicsImpostor) {
                        impostors.push(m.physicsImpostor);
                        //m.physicsImpostor._init();
                    }
                }
            };
            addToArray(impostor.object);

            const checkWithEpsilon = (value: number): number => {
                return Math.max(value, Epsilon);
            };

            const globalQuaternion: Quaternion = new Quaternion();

            for (const i of impostors) {
                if (!i.object.rotationQuaternion) {
                    return;
                }
                //get the correct bounding box
                const oldQuaternion = i.object.rotationQuaternion;
                globalQuaternion.copyFrom(oldQuaternion);

                i.object.rotationQuaternion.set(0, 0, 0, 1);
                i.object.computeWorldMatrix(true);

                const rot = globalQuaternion.toEulerAngles();
                const impostorExtents = i.getObjectExtents();

                // eslint-disable-next-line no-loss-of-precision
                const radToDeg = 57.295779513082320876;

                if (i === impostor) {
                    const center = impostor.getObjectCenter();

                    impostor.object.getAbsolutePivotPoint().subtractToRef(center, this._tmpPositionVector);
                    this._tmpPositionVector.divideInPlace(impostor.object.scaling);

                    //Can also use Array.prototype.push.apply
                    bodyConfig.pos.push(center.x);
                    bodyConfig.pos.push(center.y);
                    bodyConfig.pos.push(center.z);
                    bodyConfig.posShape.push(0, 0, 0);

                    bodyConfig.rotShape.push(0, 0, 0);
                } else {
                    const localPosition = i.object.position.clone();
                    bodyConfig.posShape.push(localPosition.x);
                    bodyConfig.posShape.push(localPosition.y);
                    bodyConfig.posShape.push(localPosition.z);

                    // bodyConfig.pos.push(0, 0, 0);

                    bodyConfig.rotShape.push(rot.x * radToDeg, rot.y * radToDeg, rot.z * radToDeg);
                }

                i.object.rotationQuaternion.copyFrom(globalQuaternion);

                // register mesh
                switch (i.type) {
                    case PhysicsImpostor.ParticleImpostor:
                        Logger.Warn("No Particle support in OIMO.js. using SphereImpostor instead");
                    // eslint-disable-next-line no-fallthrough
                    case PhysicsImpostor.SphereImpostor: {
                        const radiusX = impostorExtents.x;
                        const radiusY = impostorExtents.y;
                        const radiusZ = impostorExtents.z;

                        const size = Math.max(checkWithEpsilon(radiusX), checkWithEpsilon(radiusY), checkWithEpsilon(radiusZ)) / 2;

                        bodyConfig.type.push("sphere");
                        //due to the way oimo works with compounds, add 3 times
                        bodyConfig.size.push(size);
                        bodyConfig.size.push(size);
                        bodyConfig.size.push(size);
                        break;
                    }
                    case PhysicsImpostor.CylinderImpostor: {
                        const sizeX = checkWithEpsilon(impostorExtents.x) / 2;
                        const sizeY = checkWithEpsilon(impostorExtents.y);
                        bodyConfig.type.push("cylinder");
                        bodyConfig.size.push(sizeX);
                        bodyConfig.size.push(sizeY);
                        //due to the way oimo works with compounds, add one more value.
                        bodyConfig.size.push(sizeY);
                        break;
                    }
                    case PhysicsImpostor.PlaneImpostor:
                    case PhysicsImpostor.BoxImpostor:
                    default: {
                        const sizeX = checkWithEpsilon(impostorExtents.x);
                        const sizeY = checkWithEpsilon(impostorExtents.y);
                        const sizeZ = checkWithEpsilon(impostorExtents.z);

                        bodyConfig.type.push("box");
                        //if (i === impostor) {
                        bodyConfig.size.push(sizeX);
                        bodyConfig.size.push(sizeY);
                        bodyConfig.size.push(sizeZ);
                        //} else {
                        //    bodyConfig.size.push(0,0,0);
                        //}
                        break;
                    }
                }

                //actually not needed, but hey...
                i.object.rotationQuaternion = oldQuaternion;
            }
            impostor.physicsBody = this.world.add(bodyConfig);
            // set the quaternion, ignoring the previously defined (euler) rotation
            impostor.physicsBody.resetQuaternion(globalQuaternion);
            // update with delta 0, so the body will receive the new rotation.
            impostor.physicsBody.updatePosition(0);
        } else {
            this._tmpPositionVector.copyFromFloats(0, 0, 0);
        }

        impostor.setDeltaPosition(this._tmpPositionVector);

        //this._tmpPositionVector.addInPlace(impostor.mesh.getBoundingInfo().boundingBox.center);
        //this.setPhysicsBodyTransformation(impostor, this._tmpPositionVector, impostor.mesh.rotationQuaternion);
    }

    private _tmpPositionVector: Vector3 = Vector3.Zero();

    public removePhysicsBody(impostor: PhysicsImpostor) {
        //impostor.physicsBody.dispose();
        this.world.removeRigidBody(impostor.physicsBody);
    }

    public generateJoint(impostorJoint: PhysicsImpostorJoint) {
        const mainBody = impostorJoint.mainImpostor.physicsBody;
        const connectedBody = impostorJoint.connectedImpostor.physicsBody;

        if (!mainBody || !connectedBody) {
            return;
        }
        const jointData = impostorJoint.joint.jointData;
        const options = jointData.nativeParams || {};
        let type;
        const nativeJointData: any = {
            body1: mainBody,
            body2: connectedBody,

            axe1: options.axe1 || (jointData.mainAxis ? jointData.mainAxis.asArray() : null),
            axe2: options.axe2 || (jointData.connectedAxis ? jointData.connectedAxis.asArray() : null),
            pos1: options.pos1 || (jointData.mainPivot ? jointData.mainPivot.asArray() : null),
            pos2: options.pos2 || (jointData.connectedPivot ? jointData.connectedPivot.asArray() : null),

            min: options.min,
            max: options.max,
            collision: options.collision || jointData.collision,
            spring: options.spring,

            //supporting older version of Oimo
            world: this.world,
        };
        switch (impostorJoint.joint.type) {
            case PhysicsJoint.BallAndSocketJoint:
                type = "jointBall";
                break;
            case PhysicsJoint.SpringJoint: {
                Logger.Warn("OIMO.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
                const springData = <SpringJointData>jointData;
                nativeJointData.min = springData.length || nativeJointData.min;
                //Max should also be set, just make sure it is at least min
                nativeJointData.max = Math.max(nativeJointData.min, nativeJointData.max);
            }
            // eslint-disable-next-line no-fallthrough
            case PhysicsJoint.DistanceJoint:
                type = "jointDistance";
                nativeJointData.max = (<DistanceJointData>jointData).maxDistance;
                break;
            case PhysicsJoint.PrismaticJoint:
                type = "jointPrisme";
                break;
            case PhysicsJoint.SliderJoint:
                type = "jointSlide";
                break;
            case PhysicsJoint.WheelJoint:
                type = "jointWheel";
                break;
            case PhysicsJoint.HingeJoint:
            default:
                type = "jointHinge";
                break;
        }
        nativeJointData.type = type;
        impostorJoint.joint.physicsJoint = this.world.add(nativeJointData);
    }

    public removeJoint(impostorJoint: PhysicsImpostorJoint) {
        //Bug in Oimo prevents us from disposing a joint in the playground
        //joint.joint.physicsJoint.dispose();
        //So we will bruteforce it!
        try {
            this.world.removeJoint(impostorJoint.joint.physicsJoint);
        } catch (e) {
            Logger.Warn(e);
        }
    }

    public isSupported(): boolean {
        return this.BJSOIMO !== undefined;
    }

    public setTransformationFromPhysicsBody(impostor: PhysicsImpostor) {
        if (!impostor.physicsBody.sleeping) {
            if (impostor.physicsBody.shapes.next) {
                let parent = impostor.physicsBody.shapes;
                while (parent.next) {
                    parent = parent.next;
                }
                impostor.object.position.set(parent.position.x, parent.position.y, parent.position.z);
            } else {
                const pos = impostor.physicsBody.getPosition();
                impostor.object.position.set(pos.x, pos.y, pos.z);
            }

            if (impostor.object.rotationQuaternion) {
                const quat = impostor.physicsBody.getQuaternion();
                impostor.object.rotationQuaternion.set(quat.x, quat.y, quat.z, quat.w);
            }
        }
    }

    public setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion) {
        const body = impostor.physicsBody;
        // disable bidirectional for compound meshes
        if (impostor.physicsBody.shapes.next) {
            return;
        }
        body.position.set(newPosition.x, newPosition.y, newPosition.z);
        body.orientation.set(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
        body.syncShapes();
        body.awake();
    }

    /*private _getLastShape(body: any): any {
        var lastShape = body.shapes;
        while (lastShape.next) {
            lastShape = lastShape.next;
        }
        return lastShape;
    }*/

    public setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
        impostor.physicsBody.linearVelocity.set(velocity.x, velocity.y, velocity.z);
    }

    public setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
        impostor.physicsBody.angularVelocity.set(velocity.x, velocity.y, velocity.z);
    }

    public getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
        const v = impostor.physicsBody.linearVelocity;
        if (!v) {
            return null;
        }
        return new Vector3(v.x, v.y, v.z);
    }
    public getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
        const v = impostor.physicsBody.angularVelocity;
        if (!v) {
            return null;
        }
        return new Vector3(v.x, v.y, v.z);
    }

    public setBodyMass(impostor: PhysicsImpostor, mass: number) {
        const staticBody: boolean = mass === 0;
        //this will actually set the body's density and not its mass.
        //But this is how oimo treats the mass variable.
        impostor.physicsBody.shapes.density = staticBody ? 1 : mass;
        impostor.physicsBody.setupMass(staticBody ? 0x2 : 0x1);
    }

    public getBodyMass(impostor: PhysicsImpostor): number {
        return impostor.physicsBody.shapes.density;
    }

    public getBodyFriction(impostor: PhysicsImpostor): number {
        return impostor.physicsBody.shapes.friction;
    }

    public setBodyFriction(impostor: PhysicsImpostor, friction: number) {
        impostor.physicsBody.shapes.friction = friction;
    }

    public getBodyRestitution(impostor: PhysicsImpostor): number {
        return impostor.physicsBody.shapes.restitution;
    }

    public setBodyRestitution(impostor: PhysicsImpostor, restitution: number) {
        impostor.physicsBody.shapes.restitution = restitution;
    }

    public sleepBody(impostor: PhysicsImpostor) {
        impostor.physicsBody.sleep();
    }

    public wakeUpBody(impostor: PhysicsImpostor) {
        impostor.physicsBody.awake();
    }

    public updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number) {
        joint.physicsJoint.limitMotor.upperLimit = maxDistance;
        if (minDistance !== void 0) {
            joint.physicsJoint.limitMotor.lowerLimit = minDistance;
        }
    }

    public setMotor(joint: IMotorEnabledJoint, speed: number, force?: number, motorIndex?: number) {
        if (force !== undefined) {
            Logger.Warn("OimoJS plugin currently has unexpected behavior when using setMotor with force parameter");
        } else {
            force = 1e6;
        }
        speed *= -1;

        //TODO separate rotational and transational motors.
        const motor = motorIndex
            ? joint.physicsJoint.rotationalLimitMotor2
            : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
        if (motor) {
            motor.setMotor(speed, force);
        }
    }

    public setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number) {
        //TODO separate rotational and transational motors.
        const motor = motorIndex
            ? joint.physicsJoint.rotationalLimitMotor2
            : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
        if (motor) {
            motor.setLimit(upperLimit, lowerLimit === void 0 ? -upperLimit : lowerLimit);
        }
    }

    public syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor) {
        const body = impostor.physicsBody;

        mesh.position.x = body.position.x;
        mesh.position.y = body.position.y;
        mesh.position.z = body.position.z;

        if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.x = body.orientation.x;
            mesh.rotationQuaternion.y = body.orientation.y;
            mesh.rotationQuaternion.z = body.orientation.z;
            mesh.rotationQuaternion.w = body.orientation.w;
        }
    }

    public getRadius(impostor: PhysicsImpostor): number {
        return impostor.physicsBody.shapes.radius;
    }

    public getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void {
        const shape = impostor.physicsBody.shapes;
        result.x = shape.halfWidth * 2;
        result.y = shape.halfHeight * 2;
        result.z = shape.halfDepth * 2;
    }

    public dispose() {
        this.world.clear();
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    public raycast(from: Vector3, to: Vector3): PhysicsRaycastResult {
        Logger.Warn("raycast is not currently supported by the Oimo physics plugin");

        this._raycastResult.reset(from, to);

        return this._raycastResult;
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param result resulting PhysicsRaycastResult
     */
    public raycastToRef(from: Vector3, to: Vector3, result: PhysicsRaycastResult): void {
        Logger.Warn("raycast is not currently supported by the Oimo physics plugin");

        result.reset(from, to);
    }
}
