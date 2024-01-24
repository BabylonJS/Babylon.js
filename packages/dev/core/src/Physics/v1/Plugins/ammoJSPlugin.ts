import { Quaternion, Vector3, Matrix } from "../../../Maths/math.vector";
import type { IPhysicsEnginePlugin, PhysicsImpostorJoint } from "../IPhysicsEnginePlugin";
import { Logger } from "../../../Misc/logger";
import type { IPhysicsEnabledObject } from "../physicsImpostor";
import { PhysicsImpostor } from "../physicsImpostor";
import type { IMotorEnabledJoint, DistanceJointData } from "../physicsJoint";
import { PhysicsJoint } from "../physicsJoint";
import { VertexBuffer } from "../../../Buffers/buffer";
import { VertexData } from "../../../Meshes/mesh.vertexData";
import type { Nullable } from "../../../types";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Mesh } from "../../../Meshes/mesh";
import { ExtrudeShape } from "../../../Meshes/Builders/shapeBuilder";
import { CreateLines } from "../../../Meshes/Builders/linesBuilder";
import type { LinesMesh } from "../../../Meshes/linesMesh";
import { PhysicsRaycastResult } from "../../physicsRaycastResult";
import { Scalar } from "../../../Maths/math.scalar";
import { Epsilon } from "../../../Maths/math.constants";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let Ammo: any;

/**
 * AmmoJS Physics plugin
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 * @see https://github.com/kripken/ammo.js/
 */
export class AmmoJSPlugin implements IPhysicsEnginePlugin {
    /**
     * Reference to the Ammo library
     */
    public bjsAMMO: any = {};
    /**
     * Created ammoJS world which physics bodies are added to
     */
    public world: any;
    /**
     * Name of the plugin
     */
    public name: string = "AmmoJSPlugin";

    private _timeStep: number = 1 / 60;
    private _fixedTimeStep: number = 1 / 60;
    private _maxSteps = 5;
    private _tmpQuaternion = new Quaternion();
    private _tmpAmmoTransform: any;
    private _tmpAmmoQuaternion: any;
    private _tmpAmmoConcreteContactResultCallback: any;
    private _collisionConfiguration: any;
    private _dispatcher: any;
    private _overlappingPairCache: any;
    private _solver: any;
    private _softBodySolver: any;
    private _tmpAmmoVectorA: any;
    private _tmpAmmoVectorB: any;
    private _tmpAmmoVectorC: any;
    private _tmpAmmoVectorD: any;
    private _tmpContactCallbackResult = false;
    private _tmpAmmoVectorRCA: any;
    private _tmpAmmoVectorRCB: any;
    private _raycastResult: PhysicsRaycastResult;
    private _tmpContactPoint = new Vector3();
    private _tmpContactNormal = new Vector3();
    private _tmpContactDistance: number;
    private _tmpContactImpulse: number;
    private _tmpVec3 = new Vector3();

    private static readonly _DISABLE_COLLISION_FLAG = 4;
    private static readonly _KINEMATIC_FLAG = 2;
    private static readonly _DISABLE_DEACTIVATION_FLAG = 4;

    /**
     * Initializes the ammoJS plugin
     * @param _useDeltaForWorldStep if the time between frames should be used when calculating physics steps (Default: true)
     * @param ammoInjection can be used to inject your own ammo reference
     * @param overlappingPairCache can be used to specify your own overlapping pair cache
     */
    public constructor(
        private _useDeltaForWorldStep: boolean = true,
        ammoInjection: any = Ammo,
        overlappingPairCache: any = null
    ) {
        if (typeof ammoInjection === "function") {
            Logger.Error("AmmoJS is not ready. Please make sure you await Ammo() before using the plugin.");
            return;
        } else {
            this.bjsAMMO = ammoInjection;
        }

        if (!this.isSupported()) {
            Logger.Error("AmmoJS is not available. Please make sure you included the js file.");
            return;
        }

        // Initialize the physics world
        this._collisionConfiguration = new this.bjsAMMO.btSoftBodyRigidBodyCollisionConfiguration();
        this._dispatcher = new this.bjsAMMO.btCollisionDispatcher(this._collisionConfiguration);
        this._overlappingPairCache = overlappingPairCache || new this.bjsAMMO.btDbvtBroadphase();
        this._solver = new this.bjsAMMO.btSequentialImpulseConstraintSolver();
        this._softBodySolver = new this.bjsAMMO.btDefaultSoftBodySolver();
        this.world = new this.bjsAMMO.btSoftRigidDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration, this._softBodySolver);

        this._tmpAmmoConcreteContactResultCallback = new this.bjsAMMO.ConcreteContactResultCallback();
        this._tmpAmmoConcreteContactResultCallback.addSingleResult = (contactPoint: any) => {
            contactPoint = this.bjsAMMO.wrapPointer(contactPoint, this.bjsAMMO.btManifoldPoint);
            const worldPoint = contactPoint.getPositionWorldOnA();
            const worldNormal = contactPoint.m_normalWorldOnB;
            this._tmpContactPoint.x = worldPoint.x();
            this._tmpContactPoint.y = worldPoint.y();
            this._tmpContactPoint.z = worldPoint.z();
            this._tmpContactNormal.x = worldNormal.x();
            this._tmpContactNormal.y = worldNormal.y();
            this._tmpContactNormal.z = worldNormal.z();
            this._tmpContactImpulse = contactPoint.getAppliedImpulse();
            this._tmpContactDistance = contactPoint.getDistance();
            this._tmpContactCallbackResult = true;
        };

        this._raycastResult = new PhysicsRaycastResult();

        // Create temp ammo variables
        this._tmpAmmoTransform = new this.bjsAMMO.btTransform();
        this._tmpAmmoTransform.setIdentity();
        this._tmpAmmoQuaternion = new this.bjsAMMO.btQuaternion(0, 0, 0, 1);
        this._tmpAmmoVectorA = new this.bjsAMMO.btVector3(0, 0, 0);
        this._tmpAmmoVectorB = new this.bjsAMMO.btVector3(0, 0, 0);
        this._tmpAmmoVectorC = new this.bjsAMMO.btVector3(0, 0, 0);
        this._tmpAmmoVectorD = new this.bjsAMMO.btVector3(0, 0, 0);
    }

    /**
     *
     * @returns plugin version
     */
    public getPluginVersion(): number {
        return 1;
    }

    /**
     * Sets the gravity of the physics world (m/(s^2))
     * @param gravity Gravity to set
     */
    public setGravity(gravity: Vector3): void {
        this._tmpAmmoVectorA.setValue(gravity.x, gravity.y, gravity.z);
        this.world.setGravity(this._tmpAmmoVectorA);
        this.world.getWorldInfo().set_m_gravity(this._tmpAmmoVectorA);
    }

    /**
     * Amount of time to step forward on each frame (only used if useDeltaForWorldStep is false in the constructor)
     * @param timeStep timestep to use in seconds
     */
    public setTimeStep(timeStep: number) {
        this._timeStep = timeStep;
    }

    /**
     * Increment to step forward in the physics engine (If timeStep is set to 1/60 and fixedTimeStep is set to 1/120 the physics engine should run 2 steps per frame) (Default: 1/60)
     * @param fixedTimeStep fixedTimeStep to use in seconds
     */
    public setFixedTimeStep(fixedTimeStep: number) {
        this._fixedTimeStep = fixedTimeStep;
    }

    /**
     * Sets the maximum number of steps by the physics engine per frame (Default: 5)
     * @param maxSteps the maximum number of steps by the physics engine per frame
     */
    public setMaxSteps(maxSteps: number) {
        this._maxSteps = maxSteps;
    }

    /**
     * Gets the current timestep (only used if useDeltaForWorldStep is false in the constructor)
     * @returns the current timestep in seconds
     */
    public getTimeStep(): number {
        return this._timeStep;
    }

    /**
     * The create custom shape handler function to be called when using BABYLON.PhysicsImposter.CustomImpostor
     */
    public onCreateCustomShape: (impostor: PhysicsImpostor) => any;

    /**
     * The create custom mesh impostor handler function to support building custom mesh impostor vertex data
     */
    public onCreateCustomMeshImpostor: (impostor: PhysicsImpostor) => any;

    /**
     * The create custom convex hull impostor handler function to support building custom convex hull impostor vertex data
     */
    public onCreateCustomConvexHullImpostor: (impostor: PhysicsImpostor) => any;

    // Ammo's contactTest and contactPairTest take a callback that runs synchronously, wrap them so that they are easier to consume
    private _isImpostorInContact(impostor: PhysicsImpostor) {
        this._tmpContactCallbackResult = false;
        this.world.contactTest(impostor.physicsBody, this._tmpAmmoConcreteContactResultCallback);
        return this._tmpContactCallbackResult;
    }
    // Ammo's collision events have some weird quirks
    // contactPairTest fires too many events as it fires events even when objects are close together but contactTest does not
    // so only fire event if both contactTest and contactPairTest have a hit
    private _isImpostorPairInContact(impostorA: PhysicsImpostor, impostorB: PhysicsImpostor) {
        this._tmpContactCallbackResult = false;
        this.world.contactPairTest(impostorA.physicsBody, impostorB.physicsBody, this._tmpAmmoConcreteContactResultCallback);
        return this._tmpContactCallbackResult;
    }

    // Ammo's behavior when maxSteps > 0 does not behave as described in docs
    // @see http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
    //
    // When maxSteps is 0 do the entire simulation in one step
    // When maxSteps is > 0, run up to maxStep times, if on the last step the (remaining step - fixedTimeStep) is < fixedTimeStep, the remainder will be used for the step. (eg. if remainder is 1.001 and fixedTimeStep is 1 the last step will be 1.001, if instead it did 2 steps (1, 0.001) issues occuered when having a tiny step in ammo)
    // Note: To get deterministic physics, timeStep would always need to be divisible by fixedTimeStep
    private _stepSimulation(timeStep: number = 1 / 60, maxSteps: number = 10, fixedTimeStep: number = 1 / 60) {
        if (maxSteps == 0) {
            this.world.stepSimulation(timeStep, 0);
        } else {
            while (maxSteps > 0 && timeStep > 0) {
                if (timeStep - fixedTimeStep < fixedTimeStep) {
                    this.world.stepSimulation(timeStep, 0);
                    timeStep = 0;
                } else {
                    timeStep -= fixedTimeStep;
                    this.world.stepSimulation(fixedTimeStep, 0);
                }
                maxSteps--;
            }
        }
    }

    /**
     * Moves the physics simulation forward delta seconds and updates the given physics imposters
     * Prior to the step the imposters physics location is set to the position of the babylon meshes
     * After the step the babylon meshes are set to the position of the physics imposters
     * @param delta amount of time to step forward
     * @param impostors array of imposters to update before/after the step
     */
    public executeStep(delta: number, impostors: Array<PhysicsImpostor>): void {
        for (const impostor of impostors) {
            // Update physics world objects to match babylon world
            if (!impostor.soft) {
                impostor.beforeStep();
            }
        }

        this._stepSimulation(this._useDeltaForWorldStep ? delta : this._timeStep, this._maxSteps, this._fixedTimeStep);

        for (const mainImpostor of impostors) {
            // After physics update make babylon world objects match physics world objects
            if (mainImpostor.soft) {
                this._afterSoftStep(mainImpostor);
            } else {
                mainImpostor.afterStep();
            }

            // Handle collision event
            if (mainImpostor._onPhysicsCollideCallbacks.length > 0) {
                if (this._isImpostorInContact(mainImpostor)) {
                    for (const collideCallback of mainImpostor._onPhysicsCollideCallbacks) {
                        for (const otherImpostor of collideCallback.otherImpostors) {
                            if (mainImpostor.physicsBody.isActive() || otherImpostor.physicsBody.isActive()) {
                                if (this._isImpostorPairInContact(mainImpostor, otherImpostor)) {
                                    mainImpostor.onCollide({
                                        body: otherImpostor.physicsBody,
                                        point: this._tmpContactPoint,
                                        distance: this._tmpContactDistance,
                                        impulse: this._tmpContactImpulse,
                                        normal: this._tmpContactNormal,
                                    });
                                    otherImpostor.onCollide({
                                        body: mainImpostor.physicsBody,
                                        point: this._tmpContactPoint,
                                        distance: this._tmpContactDistance,
                                        impulse: this._tmpContactImpulse,
                                        normal: this._tmpContactNormal,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Update babylon mesh to match physics world object
     * @param impostor imposter to match
     */
    private _afterSoftStep(impostor: PhysicsImpostor): void {
        if (impostor.type === PhysicsImpostor.RopeImpostor) {
            this._ropeStep(impostor);
        } else {
            this._softbodyOrClothStep(impostor);
        }
    }

    /**
     * Update babylon mesh vertices vertices to match physics world softbody or cloth
     * @param impostor imposter to match
     */
    private _ropeStep(impostor: PhysicsImpostor): void {
        const bodyVertices = impostor.physicsBody.get_m_nodes();
        const nbVertices = bodyVertices.size();
        let node: any;
        let nodePositions: any;
        let x, y, z: number;
        const path: Array<Vector3> = new Array();
        for (let n = 0; n < nbVertices; n++) {
            node = bodyVertices.at(n);
            nodePositions = node.get_m_x();
            x = nodePositions.x();
            y = nodePositions.y();
            z = nodePositions.z();
            path.push(new Vector3(x, y, z));
        }
        const object = impostor.object;
        const shape = impostor.getParam("shape");
        if (impostor._isFromLine) {
            impostor.object = CreateLines("lines", { points: path, instance: <LinesMesh>object });
        } else {
            impostor.object = ExtrudeShape("ext", { shape: shape, path: path, instance: <Mesh>object });
        }
    }

    /**
     * Update babylon mesh vertices vertices to match physics world softbody or cloth
     * @param impostor imposter to match
     */
    private _softbodyOrClothStep(impostor: PhysicsImpostor): void {
        const normalDirection = impostor.type === PhysicsImpostor.ClothImpostor ? 1 : -1;
        const object = impostor.object;
        let vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
        if (!vertexPositions) {
            vertexPositions = [];
        }
        let vertexNormals = object.getVerticesData(VertexBuffer.NormalKind);
        if (!vertexNormals) {
            vertexNormals = [];
        }

        const nbVertices = vertexPositions.length / 3;
        const bodyVertices = impostor.physicsBody.get_m_nodes();
        let node: any;
        let nodePositions: any;
        let x, y, z: number;
        let nx, ny, nz: number;
        for (let n = 0; n < nbVertices; n++) {
            node = bodyVertices.at(n);
            nodePositions = node.get_m_x();
            x = nodePositions.x();
            y = nodePositions.y();
            z = nodePositions.z() * normalDirection;
            const nodeNormals = node.get_m_n();
            nx = nodeNormals.x();
            ny = nodeNormals.y();
            nz = nodeNormals.z() * normalDirection;

            vertexPositions[3 * n] = x;
            vertexPositions[3 * n + 1] = y;
            vertexPositions[3 * n + 2] = z;
            vertexNormals[3 * n] = nx;
            vertexNormals[3 * n + 1] = ny;
            vertexNormals[3 * n + 2] = nz;
        }

        const vertex_data = new VertexData();

        vertex_data.positions = vertexPositions;
        vertex_data.normals = vertexNormals;
        vertex_data.uvs = object.getVerticesData(VertexBuffer.UVKind);
        vertex_data.colors = object.getVerticesData(VertexBuffer.ColorKind);
        if (object && object.getIndices) {
            vertex_data.indices = object.getIndices();
        }

        vertex_data.applyToMesh(<Mesh>object);
    }

    private _tmpMatrix = new Matrix();
    /**
     * Applies an impulse on the imposter
     * @param impostor imposter to apply impulse to
     * @param force amount of force to be applied to the imposter
     * @param contactPoint the location to apply the impulse on the imposter
     */
    public applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
        if (!impostor.soft) {
            impostor.physicsBody.activate();
            const worldPoint = this._tmpAmmoVectorA;
            const impulse = this._tmpAmmoVectorB;

            // Convert contactPoint relative to center of mass
            if (impostor.object && impostor.object.getWorldMatrix) {
                contactPoint.subtractInPlace(impostor.object.getWorldMatrix().getTranslation());
            }

            worldPoint.setValue(contactPoint.x, contactPoint.y, contactPoint.z);
            impulse.setValue(force.x, force.y, force.z);

            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        } else {
            Logger.Warn("Cannot be applied to a soft body");
        }
    }

    /**
     * Applies a force on the imposter
     * @param impostor imposter to apply force
     * @param force amount of force to be applied to the imposter
     * @param contactPoint the location to apply the force on the imposter
     */
    public applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
        if (!impostor.soft) {
            impostor.physicsBody.activate();
            const worldPoint = this._tmpAmmoVectorA;
            const impulse = this._tmpAmmoVectorB;

            // Convert contactPoint relative to center of mass
            if (impostor.object && impostor.object.getWorldMatrix) {
                const localTranslation = impostor.object.getWorldMatrix().getTranslation();
                worldPoint.setValue(contactPoint.x - localTranslation.x, contactPoint.y - localTranslation.y, contactPoint.z - localTranslation.z);
            } else {
                worldPoint.setValue(contactPoint.x, contactPoint.y, contactPoint.z);
            }

            impulse.setValue(force.x, force.y, force.z);

            impostor.physicsBody.applyForce(impulse, worldPoint);
        } else {
            Logger.Warn("Cannot be applied to a soft body");
        }
    }

    /**
     * Creates a physics body using the plugin
     * @param impostor the imposter to create the physics body on
     */
    public generatePhysicsBody(impostor: PhysicsImpostor) {
        // Note: this method will not be called on child imposotrs for compound impostors

        impostor._pluginData.toDispose = [];

        //parent-child relationship
        if (impostor.parent) {
            if (impostor.physicsBody) {
                this.removePhysicsBody(impostor);
                impostor.forceUpdate();
            }
            return;
        }

        if (impostor.isBodyInitRequired()) {
            const colShape = this._createShape(impostor);
            const mass = impostor.getParam("mass");
            impostor._pluginData.mass = mass;
            if (impostor.soft) {
                colShape.get_m_cfg().set_collisions(0x11);
                colShape.get_m_cfg().set_kDP(impostor.getParam("damping"));
                this.bjsAMMO.castObject(colShape, this.bjsAMMO.btCollisionObject).getCollisionShape().setMargin(impostor.getParam("margin"));
                colShape.setActivationState(AmmoJSPlugin._DISABLE_DEACTIVATION_FLAG);
                this.world.addSoftBody(colShape, 1, -1);
                impostor.physicsBody = colShape;
                impostor._pluginData.toDispose.push(colShape);
                this.setBodyPressure(impostor, 0);
                if (impostor.type === PhysicsImpostor.SoftbodyImpostor) {
                    this.setBodyPressure(impostor, impostor.getParam("pressure"));
                }
                this.setBodyStiffness(impostor, impostor.getParam("stiffness"));
                this.setBodyVelocityIterations(impostor, impostor.getParam("velocityIterations"));
                this.setBodyPositionIterations(impostor, impostor.getParam("positionIterations"));
            } else {
                const localInertia = new this.bjsAMMO.btVector3(0, 0, 0);
                const startTransform = new this.bjsAMMO.btTransform();
                impostor.object.computeWorldMatrix(true);
                startTransform.setIdentity();
                if (mass !== 0) {
                    colShape.calculateLocalInertia(mass, localInertia);
                }
                this._tmpAmmoVectorA.setValue(impostor.object.position.x, impostor.object.position.y, impostor.object.position.z);
                this._tmpAmmoQuaternion.setValue(
                    impostor.object.rotationQuaternion!.x,
                    impostor.object.rotationQuaternion!.y,
                    impostor.object.rotationQuaternion!.z,
                    impostor.object.rotationQuaternion!.w
                );
                startTransform.setOrigin(this._tmpAmmoVectorA);
                startTransform.setRotation(this._tmpAmmoQuaternion);
                const myMotionState = new this.bjsAMMO.btDefaultMotionState(startTransform);
                const rbInfo = new this.bjsAMMO.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia);
                const body = new this.bjsAMMO.btRigidBody(rbInfo);

                // Make objects kinematic if it's mass is 0
                if (mass === 0) {
                    body.setCollisionFlags(body.getCollisionFlags() | AmmoJSPlugin._KINEMATIC_FLAG);
                    body.setActivationState(AmmoJSPlugin._DISABLE_DEACTIVATION_FLAG);
                }

                // Disable collision if NoImpostor, but keep collision if shape is btCompoundShape
                if (impostor.type == PhysicsImpostor.NoImpostor && !colShape.getChildShape) {
                    body.setCollisionFlags(body.getCollisionFlags() | AmmoJSPlugin._DISABLE_COLLISION_FLAG);
                }

                // compute delta position: compensate the difference between shape center and mesh origin
                if (impostor.type !== PhysicsImpostor.MeshImpostor && impostor.type !== PhysicsImpostor.NoImpostor) {
                    const boundingInfo = impostor.object.getBoundingInfo();
                    this._tmpVec3.copyFrom(impostor.object.getAbsolutePosition());
                    this._tmpVec3.subtractInPlace(boundingInfo.boundingBox.centerWorld);
                    this._tmpVec3.x /= impostor.object.scaling.x;
                    this._tmpVec3.y /= impostor.object.scaling.y;
                    this._tmpVec3.z /= impostor.object.scaling.z;
                    impostor.setDeltaPosition(this._tmpVec3);
                }

                const group = impostor.getParam("group");
                const mask = impostor.getParam("mask");
                if (group && mask) {
                    this.world.addRigidBody(body, group, mask);
                } else {
                    this.world.addRigidBody(body);
                }
                impostor.physicsBody = body;
                impostor._pluginData.toDispose = impostor._pluginData.toDispose.concat([body, rbInfo, myMotionState, startTransform, localInertia, colShape]);
            }
            this.setBodyRestitution(impostor, impostor.getParam("restitution"));
            this.setBodyFriction(impostor, impostor.getParam("friction"));
        }
    }

    /**
     * Removes the physics body from the imposter and disposes of the body's memory
     * @param impostor imposter to remove the physics body from
     */
    public removePhysicsBody(impostor: PhysicsImpostor) {
        if (this.world) {
            if (impostor.soft) {
                this.world.removeSoftBody(impostor.physicsBody);
            } else {
                this.world.removeRigidBody(impostor.physicsBody);
            }

            if (impostor._pluginData) {
                impostor._pluginData.toDispose.forEach((d: any) => {
                    this.bjsAMMO.destroy(d);
                });
                impostor._pluginData.toDispose = [];
            }
        }
    }

    /**
     * Generates a joint
     * @param impostorJoint the imposter joint to create the joint with
     */
    public generateJoint(impostorJoint: PhysicsImpostorJoint) {
        const mainBody = impostorJoint.mainImpostor.physicsBody;
        const connectedBody = impostorJoint.connectedImpostor.physicsBody;
        if (!mainBody || !connectedBody) {
            return;
        }

        const jointData = impostorJoint.joint.jointData;
        if (!jointData.mainPivot) {
            jointData.mainPivot = new Vector3(0, 0, 0);
        }
        if (!jointData.connectedPivot) {
            jointData.connectedPivot = new Vector3(0, 0, 0);
        }

        let joint: any;
        switch (impostorJoint.joint.type) {
            case PhysicsJoint.DistanceJoint: {
                const distance = (<DistanceJointData>jointData).maxDistance;
                if (distance) {
                    jointData.mainPivot = new Vector3(0, -distance / 2, 0);
                    jointData.connectedPivot = new Vector3(0, distance / 2, 0);
                }
                joint = new this.bjsAMMO.btPoint2PointConstraint(
                    mainBody,
                    connectedBody,
                    new this.bjsAMMO.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z),
                    new this.bjsAMMO.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z)
                );
                break;
            }
            case PhysicsJoint.HingeJoint: {
                if (!jointData.mainAxis) {
                    jointData.mainAxis = new Vector3(0, 0, 0);
                }
                if (!jointData.connectedAxis) {
                    jointData.connectedAxis = new Vector3(0, 0, 0);
                }
                const mainAxis = new this.bjsAMMO.btVector3(jointData.mainAxis.x, jointData.mainAxis.y, jointData.mainAxis.z);
                const connectedAxis = new this.bjsAMMO.btVector3(jointData.connectedAxis.x, jointData.connectedAxis.y, jointData.connectedAxis.z);
                joint = new this.bjsAMMO.btHingeConstraint(
                    mainBody,
                    connectedBody,
                    new this.bjsAMMO.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z),
                    new this.bjsAMMO.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z),
                    mainAxis,
                    connectedAxis
                );
                break;
            }
            case PhysicsJoint.BallAndSocketJoint:
                joint = new this.bjsAMMO.btPoint2PointConstraint(
                    mainBody,
                    connectedBody,
                    new this.bjsAMMO.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z),
                    new this.bjsAMMO.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z)
                );
                break;
            default:
                Logger.Warn("JointType not currently supported by the Ammo plugin, falling back to PhysicsJoint.BallAndSocketJoint");
                joint = new this.bjsAMMO.btPoint2PointConstraint(
                    mainBody,
                    connectedBody,
                    new this.bjsAMMO.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z),
                    new this.bjsAMMO.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z)
                );
                break;
        }
        this.world.addConstraint(joint, !impostorJoint.joint.jointData.collision);
        impostorJoint.joint.physicsJoint = joint;
    }

    /**
     * Removes a joint
     * @param impostorJoint the imposter joint to remove the joint from
     */
    public removeJoint(impostorJoint: PhysicsImpostorJoint) {
        if (this.world) {
            this.world.removeConstraint(impostorJoint.joint.physicsJoint);
        }
    }

    // adds all verticies (including child verticies) to the triangle mesh
    private _addMeshVerts(btTriangleMesh: any, topLevelObject: IPhysicsEnabledObject, object: IPhysicsEnabledObject) {
        let triangleCount = 0;
        if (object && object.getIndices && object.getWorldMatrix && object.getChildMeshes) {
            let indices = object.getIndices();
            if (!indices) {
                indices = [];
            }
            let vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
            if (!vertexPositions) {
                vertexPositions = [];
            }

            let localMatrix;

            if (topLevelObject && topLevelObject !== object) {
                // top level matrix used for shape transform doesn't take scale into account.
                // Moreover, every children vertex position must be in that space.
                // So, each vertex position here is transform by (mesh world matrix * toplevelMatrix -1)
                let topLevelQuaternion;
                if (topLevelObject.rotationQuaternion) {
                    topLevelQuaternion = topLevelObject.rotationQuaternion;
                } else if (topLevelObject.rotation) {
                    topLevelQuaternion = Quaternion.FromEulerAngles(topLevelObject.rotation.x, topLevelObject.rotation.y, topLevelObject.rotation.z);
                } else {
                    topLevelQuaternion = Quaternion.Identity();
                }
                const topLevelMatrix = Matrix.Compose(Vector3.One(), topLevelQuaternion, topLevelObject.position);
                topLevelMatrix.invertToRef(this._tmpMatrix);
                const wm = object.computeWorldMatrix(false);
                localMatrix = wm.multiply(this._tmpMatrix);
            } else {
                // current top level is same as object level -> only use local scaling
                Matrix.ScalingToRef(object.scaling.x, object.scaling.y, object.scaling.z, this._tmpMatrix);
                localMatrix = this._tmpMatrix;
            }
            const faceCount = indices.length / 3;
            for (let i = 0; i < faceCount; i++) {
                const triPoints = [];
                for (let point = 0; point < 3; point++) {
                    let v = new Vector3(
                        vertexPositions[indices[i * 3 + point] * 3 + 0],
                        vertexPositions[indices[i * 3 + point] * 3 + 1],
                        vertexPositions[indices[i * 3 + point] * 3 + 2]
                    );

                    v = Vector3.TransformCoordinates(v, localMatrix);

                    let vec: any;
                    if (point == 0) {
                        vec = this._tmpAmmoVectorA;
                    } else if (point == 1) {
                        vec = this._tmpAmmoVectorB;
                    } else {
                        vec = this._tmpAmmoVectorC;
                    }
                    vec.setValue(v.x, v.y, v.z);

                    triPoints.push(vec);
                }
                btTriangleMesh.addTriangle(triPoints[0], triPoints[1], triPoints[2]);
                triangleCount++;
            }

            object.getChildMeshes().forEach((m) => {
                triangleCount += this._addMeshVerts(btTriangleMesh, topLevelObject, m);
            });
        }
        return triangleCount;
    }

    /**
     * Initialise the soft body vertices to match its object's (mesh) vertices
     * Softbody vertices (nodes) are in world space and to match this
     * The object's position and rotation is set to zero and so its vertices are also then set in world space
     * @param impostor to create the softbody for
     * @returns the number of vertices added to the softbody
     */
    private _softVertexData(impostor: PhysicsImpostor): VertexData {
        const object = impostor.object;
        if (object && object.getIndices && object.getWorldMatrix && object.getChildMeshes) {
            let indices = object.getIndices();
            if (!indices) {
                indices = [];
            }
            let vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
            if (!vertexPositions) {
                vertexPositions = [];
            }
            let vertexNormals = object.getVerticesData(VertexBuffer.NormalKind);
            if (!vertexNormals) {
                vertexNormals = [];
            }
            object.computeWorldMatrix(false);
            const newPoints = [];
            const newNorms = [];
            for (let i = 0; i < vertexPositions.length; i += 3) {
                let v = new Vector3(vertexPositions[i], vertexPositions[i + 1], vertexPositions[i + 2]);
                let n = new Vector3(vertexNormals[i], vertexNormals[i + 1], vertexNormals[i + 2]);
                v = Vector3.TransformCoordinates(v, object.getWorldMatrix());
                n = Vector3.TransformNormal(n, object.getWorldMatrix());
                newPoints.push(v.x, v.y, v.z);
                newNorms.push(n.x, n.y, n.z);
            }

            const vertex_data = new VertexData();

            vertex_data.positions = newPoints;
            vertex_data.normals = newNorms;
            vertex_data.uvs = object.getVerticesData(VertexBuffer.UVKind);
            vertex_data.colors = object.getVerticesData(VertexBuffer.ColorKind);
            if (object && object.getIndices) {
                vertex_data.indices = object.getIndices();
            }

            vertex_data.applyToMesh(<Mesh>object);

            object.position = Vector3.Zero();
            object.rotationQuaternion = null;
            object.rotation = Vector3.Zero();
            object.computeWorldMatrix(true);

            return vertex_data;
        }
        return VertexData.ExtractFromMesh(<Mesh>object);
    }

    /**
     * Create an impostor's soft body
     * @param impostor to create the softbody for
     * @returns the softbody
     */
    private _createSoftbody(impostor: PhysicsImpostor) {
        const object = impostor.object;
        if (object && object.getIndices) {
            let indices = object.getIndices();
            if (!indices) {
                indices = [];
            }

            const vertex_data = this._softVertexData(impostor);
            const vertexPositions = vertex_data.positions;
            const vertexNormals = vertex_data.normals;

            if (vertexPositions === null || vertexNormals === null) {
                return new this.bjsAMMO.btCompoundShape();
            } else {
                const triPoints = [];
                const triNorms = [];
                for (let i = 0; i < vertexPositions.length; i += 3) {
                    const v = new Vector3(vertexPositions[i], vertexPositions[i + 1], vertexPositions[i + 2]);
                    const n = new Vector3(vertexNormals[i], vertexNormals[i + 1], vertexNormals[i + 2]);
                    triPoints.push(v.x, v.y, -v.z);
                    triNorms.push(n.x, n.y, -n.z);
                }
                const softBody = new this.bjsAMMO.btSoftBodyHelpers().CreateFromTriMesh(this.world.getWorldInfo(), triPoints, object.getIndices(), indices.length / 3, true);

                const nbVertices = vertexPositions.length / 3;
                const bodyVertices = softBody.get_m_nodes();
                let node: any;
                let nodeNormals: any;
                for (let i = 0; i < nbVertices; i++) {
                    node = bodyVertices.at(i);
                    nodeNormals = node.get_m_n();
                    nodeNormals.setX(triNorms[3 * i]);
                    nodeNormals.setY(triNorms[3 * i + 1]);
                    nodeNormals.setZ(triNorms[3 * i + 2]);
                }
                return softBody;
            }
        }
    }

    /**
     * Create cloth for an impostor
     * @param impostor to create the softbody for
     * @returns the cloth
     */
    private _createCloth(impostor: PhysicsImpostor) {
        const object = impostor.object;
        if (object && object.getIndices) {
            let indices = object.getIndices();
            if (!indices) {
                indices = [];
            }

            const vertex_data = this._softVertexData(impostor);
            const vertexPositions = vertex_data.positions;
            const vertexNormals = vertex_data.normals;

            if (vertexPositions === null || vertexNormals === null) {
                return new this.bjsAMMO.btCompoundShape();
            } else {
                const len = vertexPositions.length;
                const segments = Math.sqrt(len / 3);
                impostor.segments = segments;
                const segs = segments - 1;
                this._tmpAmmoVectorA.setValue(vertexPositions[0], vertexPositions[1], vertexPositions[2]);
                this._tmpAmmoVectorB.setValue(vertexPositions[3 * segs], vertexPositions[3 * segs + 1], vertexPositions[3 * segs + 2]);
                this._tmpAmmoVectorD.setValue(vertexPositions[len - 3], vertexPositions[len - 2], vertexPositions[len - 1]);
                this._tmpAmmoVectorC.setValue(vertexPositions[len - 3 - 3 * segs], vertexPositions[len - 2 - 3 * segs], vertexPositions[len - 1 - 3 * segs]);

                const clothBody = new this.bjsAMMO.btSoftBodyHelpers().CreatePatch(
                    this.world.getWorldInfo(),
                    this._tmpAmmoVectorA,
                    this._tmpAmmoVectorB,
                    this._tmpAmmoVectorC,
                    this._tmpAmmoVectorD,
                    segments,
                    segments,
                    impostor.getParam("fixedPoints"),
                    true
                );
                return clothBody;
            }
        }
    }

    /**
     * Create rope for an impostor
     * @param impostor to create the softbody for
     * @returns the rope
     */
    private _createRope(impostor: PhysicsImpostor) {
        let len: number;
        let segments: number;
        const vertex_data = this._softVertexData(impostor);
        const vertexPositions = vertex_data.positions;
        const vertexNormals = vertex_data.normals;

        if (vertexPositions === null || vertexNormals === null) {
            return new this.bjsAMMO.btCompoundShape();
        }

        //force the mesh to be updatable
        vertex_data.applyToMesh(<Mesh>impostor.object, true);

        impostor._isFromLine = true;

        // If in lines mesh all normals will be zero
        const vertexSquared: Array<number> = <Array<number>>vertexNormals.map((x: number) => x * x);
        const reducer = (accumulator: number, currentValue: number): number => accumulator + currentValue;
        const reduced: number = vertexSquared.reduce(reducer);

        if (reduced === 0) {
            // line mesh
            len = vertexPositions.length;
            segments = len / 3 - 1;
            this._tmpAmmoVectorA.setValue(vertexPositions[0], vertexPositions[1], vertexPositions[2]);
            this._tmpAmmoVectorB.setValue(vertexPositions[len - 3], vertexPositions[len - 2], vertexPositions[len - 1]);
        } else {
            //extruded mesh
            impostor._isFromLine = false;
            const pathVectors = impostor.getParam("path");
            const shape = impostor.getParam("shape");
            if (shape === null) {
                Logger.Warn("No shape available for extruded mesh");
                return new this.bjsAMMO.btCompoundShape();
            }
            len = pathVectors.length;
            segments = len - 1;
            this._tmpAmmoVectorA.setValue(pathVectors[0].x, pathVectors[0].y, pathVectors[0].z);
            this._tmpAmmoVectorB.setValue(pathVectors[len - 1].x, pathVectors[len - 1].y, pathVectors[len - 1].z);
        }

        impostor.segments = segments;

        let fixedPoints = impostor.getParam("fixedPoints");
        fixedPoints = fixedPoints > 3 ? 3 : fixedPoints;

        const ropeBody = new this.bjsAMMO.btSoftBodyHelpers().CreateRope(this.world.getWorldInfo(), this._tmpAmmoVectorA, this._tmpAmmoVectorB, segments - 1, fixedPoints);
        ropeBody.get_m_cfg().set_collisions(0x11);
        return ropeBody;
    }

    /**
     * Create a custom physics impostor shape using the plugin's onCreateCustomShape handler
     * @param impostor to create the custom physics shape for
     * @returns the custom physics shape
     */
    private _createCustom(impostor: PhysicsImpostor): any {
        let returnValue: any = null;
        if (this.onCreateCustomShape) {
            returnValue = this.onCreateCustomShape(impostor);
        }
        if (returnValue == null) {
            returnValue = new this.bjsAMMO.btCompoundShape();
        }
        return returnValue;
    }

    // adds all verticies (including child verticies) to the convex hull shape
    private _addHullVerts(btConvexHullShape: any, topLevelObject: IPhysicsEnabledObject, object: IPhysicsEnabledObject) {
        let triangleCount = 0;
        if (object && object.getIndices && object.getWorldMatrix && object.getChildMeshes) {
            let indices = object.getIndices();
            if (!indices) {
                indices = [];
            }
            let vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
            if (!vertexPositions) {
                vertexPositions = [];
            }
            object.computeWorldMatrix(false);
            const faceCount = indices.length / 3;
            for (let i = 0; i < faceCount; i++) {
                const triPoints = [];
                for (let point = 0; point < 3; point++) {
                    let v = new Vector3(
                        vertexPositions[indices[i * 3 + point] * 3 + 0],
                        vertexPositions[indices[i * 3 + point] * 3 + 1],
                        vertexPositions[indices[i * 3 + point] * 3 + 2]
                    );

                    // Adjust for initial scaling
                    Matrix.ScalingToRef(object.scaling.x, object.scaling.y, object.scaling.z, this._tmpMatrix);
                    v = Vector3.TransformCoordinates(v, this._tmpMatrix);

                    let vec: any;
                    if (point == 0) {
                        vec = this._tmpAmmoVectorA;
                    } else if (point == 1) {
                        vec = this._tmpAmmoVectorB;
                    } else {
                        vec = this._tmpAmmoVectorC;
                    }
                    vec.setValue(v.x, v.y, v.z);

                    triPoints.push(vec);
                }
                btConvexHullShape.addPoint(triPoints[0], true);
                btConvexHullShape.addPoint(triPoints[1], true);
                btConvexHullShape.addPoint(triPoints[2], true);
                triangleCount++;
            }

            object.getChildMeshes().forEach((m) => {
                triangleCount += this._addHullVerts(btConvexHullShape, topLevelObject, m);
            });
        }
        return triangleCount;
    }

    private _createShape(impostor: PhysicsImpostor, ignoreChildren = false) {
        const object = impostor.object;

        let returnValue: any;
        const impostorExtents = impostor.getObjectExtents();

        if (!ignoreChildren) {
            const meshChildren = impostor.object.getChildMeshes ? impostor.object.getChildMeshes(true) : [];
            returnValue = new this.bjsAMMO.btCompoundShape();

            // Add shape of all children to the compound shape
            let childrenAdded = 0;
            meshChildren.forEach((childMesh) => {
                const childImpostor = childMesh.getPhysicsImpostor();
                if (childImpostor) {
                    if (childImpostor.type == PhysicsImpostor.MeshImpostor) {
                        // eslint-disable-next-line no-throw-literal
                        throw "A child MeshImpostor is not supported. Only primitive impostors are supported as children (eg. box or sphere)";
                    }
                    const shape = this._createShape(childImpostor);

                    // Position needs to be scaled based on parent's scaling
                    const parentMat = childMesh.parent!.getWorldMatrix().clone();
                    const s = new Vector3();
                    parentMat.decompose(s);
                    this._tmpAmmoTransform.getOrigin().setValue(childMesh.position.x * s.x, childMesh.position.y * s.y, childMesh.position.z * s.z);

                    this._tmpAmmoQuaternion.setValue(
                        childMesh.rotationQuaternion!.x,
                        childMesh.rotationQuaternion!.y,
                        childMesh.rotationQuaternion!.z,
                        childMesh.rotationQuaternion!.w
                    );
                    this._tmpAmmoTransform.setRotation(this._tmpAmmoQuaternion);
                    returnValue.addChildShape(this._tmpAmmoTransform, shape);
                    childImpostor.dispose();
                    childrenAdded++;
                }
            });

            if (childrenAdded > 0) {
                // Add parents shape as a child if present
                if (impostor.type != PhysicsImpostor.NoImpostor) {
                    const shape = this._createShape(impostor, true);
                    if (shape) {
                        this._tmpAmmoTransform.getOrigin().setValue(0, 0, 0);
                        this._tmpAmmoQuaternion.setValue(0, 0, 0, 1);
                        this._tmpAmmoTransform.setRotation(this._tmpAmmoQuaternion);

                        returnValue.addChildShape(this._tmpAmmoTransform, shape);
                    }
                }
                return returnValue;
            } else {
                // If no children with impostors create the actual shape below instead
                this.bjsAMMO.destroy(returnValue);
                returnValue = null;
            }
        }

        switch (impostor.type) {
            case PhysicsImpostor.SphereImpostor:
                // Is there a better way to compare floats number? With an epsilon or with a Math function
                if (Scalar.WithinEpsilon(impostorExtents.x, impostorExtents.y, 0.0001) && Scalar.WithinEpsilon(impostorExtents.x, impostorExtents.z, 0.0001)) {
                    returnValue = new this.bjsAMMO.btSphereShape(impostorExtents.x / 2);
                } else {
                    // create a btMultiSphereShape because it's not possible to set a local scaling on a btSphereShape
                    const positions = [new this.bjsAMMO.btVector3(0, 0, 0)];
                    const radii = [1];
                    returnValue = new this.bjsAMMO.btMultiSphereShape(positions, radii, 1);
                    returnValue.setLocalScaling(new this.bjsAMMO.btVector3(impostorExtents.x / 2, impostorExtents.y / 2, impostorExtents.z / 2));
                }
                break;
            case PhysicsImpostor.CapsuleImpostor:
                {
                    // https://pybullet.org/Bullet/BulletFull/classbtCapsuleShape.html#details
                    // Height is just the height between the center of each 'sphere' of the capsule caps
                    const capRadius = impostorExtents.x / 2;
                    returnValue = new this.bjsAMMO.btCapsuleShape(capRadius, impostorExtents.y - capRadius * 2);
                }
                break;
            case PhysicsImpostor.CylinderImpostor:
                this._tmpAmmoVectorA.setValue(impostorExtents.x / 2, impostorExtents.y / 2, impostorExtents.z / 2);
                returnValue = new this.bjsAMMO.btCylinderShape(this._tmpAmmoVectorA);
                break;
            case PhysicsImpostor.PlaneImpostor:
            case PhysicsImpostor.BoxImpostor:
                this._tmpAmmoVectorA.setValue(impostorExtents.x / 2, impostorExtents.y / 2, impostorExtents.z / 2);
                returnValue = new this.bjsAMMO.btBoxShape(this._tmpAmmoVectorA);
                break;
            case PhysicsImpostor.MeshImpostor: {
                if (impostor.getParam("mass") == 0) {
                    // Only create btBvhTriangleMeshShape if the impostor is static
                    // See https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=7283
                    if (this.onCreateCustomMeshImpostor) {
                        returnValue = this.onCreateCustomMeshImpostor(impostor);
                    } else {
                        const triMesh = new this.bjsAMMO.btTriangleMesh();
                        impostor._pluginData.toDispose.push(triMesh);
                        const triangleCount = this._addMeshVerts(triMesh, object, object);
                        if (triangleCount == 0) {
                            returnValue = new this.bjsAMMO.btCompoundShape();
                        } else {
                            returnValue = new this.bjsAMMO.btBvhTriangleMeshShape(triMesh);
                        }
                    }
                    break;
                }
            }
            // Otherwise create convexHullImpostor
            // eslint-disable-next-line no-fallthrough
            case PhysicsImpostor.ConvexHullImpostor: {
                if (this.onCreateCustomConvexHullImpostor) {
                    returnValue = this.onCreateCustomConvexHullImpostor(impostor);
                } else {
                    const convexHull = new this.bjsAMMO.btConvexHullShape();
                    const triangleCount = this._addHullVerts(convexHull, object, object);
                    if (triangleCount == 0) {
                        // Cleanup Unused Convex Hull Shape
                        impostor._pluginData.toDispose.push(convexHull);
                        returnValue = new this.bjsAMMO.btCompoundShape();
                    } else {
                        returnValue = convexHull;
                    }
                }
                break;
            }
            case PhysicsImpostor.NoImpostor:
                // Fill with sphere but collision is disabled on the rigid body in generatePhysicsBody, using an empty shape caused unexpected movement with joints
                returnValue = new this.bjsAMMO.btSphereShape(impostorExtents.x / 2);
                break;
            case PhysicsImpostor.CustomImpostor:
                // Only usable when the plugin's onCreateCustomShape is set
                returnValue = this._createCustom(impostor);
                break;
            case PhysicsImpostor.SoftbodyImpostor:
                // Only usable with a mesh that has sufficient and shared vertices
                returnValue = this._createSoftbody(impostor);
                break;
            case PhysicsImpostor.ClothImpostor:
                // Only usable with a ground mesh that has sufficient and shared vertices
                returnValue = this._createCloth(impostor);
                break;
            case PhysicsImpostor.RopeImpostor:
                // Only usable with a line mesh or an extruded mesh that is updatable
                returnValue = this._createRope(impostor);
                break;
            default:
                Logger.Warn("The impostor type is not currently supported by the ammo plugin.");
                break;
        }

        return returnValue;
    }

    /**
     * Sets the mesh body position/rotation from the babylon impostor
     * @param impostor imposter containing the physics body and babylon object
     */
    public setTransformationFromPhysicsBody(impostor: PhysicsImpostor) {
        impostor.physicsBody.getMotionState().getWorldTransform(this._tmpAmmoTransform);
        impostor.object.position.set(this._tmpAmmoTransform.getOrigin().x(), this._tmpAmmoTransform.getOrigin().y(), this._tmpAmmoTransform.getOrigin().z());

        if (!impostor.object.rotationQuaternion) {
            if (impostor.object.rotation) {
                this._tmpQuaternion.set(
                    this._tmpAmmoTransform.getRotation().x(),
                    this._tmpAmmoTransform.getRotation().y(),
                    this._tmpAmmoTransform.getRotation().z(),
                    this._tmpAmmoTransform.getRotation().w()
                );
                this._tmpQuaternion.toEulerAnglesToRef(impostor.object.rotation);
            }
        } else {
            impostor.object.rotationQuaternion.set(
                this._tmpAmmoTransform.getRotation().x(),
                this._tmpAmmoTransform.getRotation().y(),
                this._tmpAmmoTransform.getRotation().z(),
                this._tmpAmmoTransform.getRotation().w()
            );
        }
    }

    /**
     * Sets the babylon object's position/rotation from the physics body's position/rotation
     * @param impostor imposter containing the physics body and babylon object
     * @param newPosition new position
     * @param newRotation new rotation
     */
    public setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion) {
        const trans = impostor.physicsBody.getWorldTransform();

        // If rotation/position has changed update and activate rigged body
        if (
            Math.abs(trans.getOrigin().x() - newPosition.x) > Epsilon ||
            Math.abs(trans.getOrigin().y() - newPosition.y) > Epsilon ||
            Math.abs(trans.getOrigin().z() - newPosition.z) > Epsilon ||
            Math.abs(trans.getRotation().x() - newRotation.x) > Epsilon ||
            Math.abs(trans.getRotation().y() - newRotation.y) > Epsilon ||
            Math.abs(trans.getRotation().z() - newRotation.z) > Epsilon ||
            Math.abs(trans.getRotation().w() - newRotation.w) > Epsilon
        ) {
            this._tmpAmmoVectorA.setValue(newPosition.x, newPosition.y, newPosition.z);
            trans.setOrigin(this._tmpAmmoVectorA);

            this._tmpAmmoQuaternion.setValue(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
            trans.setRotation(this._tmpAmmoQuaternion);
            impostor.physicsBody.setWorldTransform(trans);

            if (impostor.mass == 0) {
                // Kinematic objects must be updated using motion state
                const motionState = impostor.physicsBody.getMotionState();
                if (motionState) {
                    motionState.setWorldTransform(trans);
                }
            } else {
                impostor.physicsBody.activate();
            }
        }
    }

    /**
     * If this plugin is supported
     * @returns true if its supported
     */
    public isSupported(): boolean {
        return this.bjsAMMO !== undefined;
    }

    /**
     * Sets the linear velocity of the physics body
     * @param impostor imposter to set the velocity on
     * @param velocity velocity to set
     */
    public setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
        this._tmpAmmoVectorA.setValue(velocity.x, velocity.y, velocity.z);
        if (impostor.soft) {
            impostor.physicsBody.linearVelocity(this._tmpAmmoVectorA);
        } else {
            impostor.physicsBody.setLinearVelocity(this._tmpAmmoVectorA);
        }
    }

    /**
     * Sets the angular velocity of the physics body
     * @param impostor imposter to set the velocity on
     * @param velocity velocity to set
     */
    public setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
        this._tmpAmmoVectorA.setValue(velocity.x, velocity.y, velocity.z);
        if (impostor.soft) {
            impostor.physicsBody.angularVelocity(this._tmpAmmoVectorA);
        } else {
            impostor.physicsBody.setAngularVelocity(this._tmpAmmoVectorA);
        }
    }

    /**
     * gets the linear velocity
     * @param impostor imposter to get linear velocity from
     * @returns linear velocity
     */
    public getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
        let v: any;
        if (impostor.soft) {
            v = impostor.physicsBody.linearVelocity();
        } else {
            v = impostor.physicsBody.getLinearVelocity();
        }
        if (!v) {
            return null;
        }
        const result = new Vector3(v.x(), v.y(), v.z());
        this.bjsAMMO.destroy(v);
        return result;
    }

    /**
     * gets the angular velocity
     * @param impostor imposter to get angular velocity from
     * @returns angular velocity
     */
    public getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
        let v: any;
        if (impostor.soft) {
            v = impostor.physicsBody.angularVelocity();
        } else {
            v = impostor.physicsBody.getAngularVelocity();
        }
        if (!v) {
            return null;
        }
        const result = new Vector3(v.x(), v.y(), v.z());
        this.bjsAMMO.destroy(v);
        return result;
    }

    /**
     * Sets the mass of physics body
     * @param impostor imposter to set the mass on
     * @param mass mass to set
     */
    public setBodyMass(impostor: PhysicsImpostor, mass: number) {
        if (impostor.soft) {
            impostor.physicsBody.setTotalMass(mass, false);
        } else {
            impostor.physicsBody.setMassProps(mass);
        }
        impostor._pluginData.mass = mass;
    }

    /**
     * Gets the mass of the physics body
     * @param impostor imposter to get the mass from
     * @returns mass
     */
    public getBodyMass(impostor: PhysicsImpostor): number {
        return impostor._pluginData.mass || 0;
    }

    /**
     * Gets friction of the impostor
     * @param impostor impostor to get friction from
     * @returns friction value
     */
    public getBodyFriction(impostor: PhysicsImpostor): number {
        return impostor._pluginData.friction || 0;
    }

    /**
     * Sets friction of the impostor
     * @param impostor impostor to set friction on
     * @param friction friction value
     */
    public setBodyFriction(impostor: PhysicsImpostor, friction: number) {
        if (impostor.soft) {
            impostor.physicsBody.get_m_cfg().set_kDF(friction);
        } else {
            impostor.physicsBody.setFriction(friction);
        }
        impostor._pluginData.friction = friction;
    }

    /**
     * Gets restitution of the impostor
     * @param impostor impostor to get restitution from
     * @returns restitution value
     */
    public getBodyRestitution(impostor: PhysicsImpostor): number {
        return impostor._pluginData.restitution || 0;
    }

    /**
     * Sets restitution of the impostor
     * @param impostor impostor to set resitution on
     * @param restitution resitution value
     */
    public setBodyRestitution(impostor: PhysicsImpostor, restitution: number) {
        impostor.physicsBody.setRestitution(restitution);
        impostor._pluginData.restitution = restitution;
    }

    /**
     * Gets pressure inside the impostor
     * @param impostor impostor to get pressure from
     * @returns pressure value
     */
    public getBodyPressure(impostor: PhysicsImpostor): number {
        if (!impostor.soft) {
            Logger.Warn("Pressure is not a property of a rigid body");
            return 0;
        }
        return impostor._pluginData.pressure || 0;
    }

    /**
     * Sets pressure inside a soft body impostor
     * Cloth and rope must remain 0 pressure
     * @param impostor impostor to set pressure on
     * @param pressure pressure value
     */
    public setBodyPressure(impostor: PhysicsImpostor, pressure: number) {
        if (impostor.soft) {
            if (impostor.type === PhysicsImpostor.SoftbodyImpostor) {
                impostor.physicsBody.get_m_cfg().set_kPR(pressure);
                impostor._pluginData.pressure = pressure;
            } else {
                impostor.physicsBody.get_m_cfg().set_kPR(0);
                impostor._pluginData.pressure = 0;
            }
        } else {
            Logger.Warn("Pressure can only be applied to a softbody");
        }
    }

    /**
     * Gets stiffness of the impostor
     * @param impostor impostor to get stiffness from
     * @returns pressure value
     */
    public getBodyStiffness(impostor: PhysicsImpostor): number {
        if (!impostor.soft) {
            Logger.Warn("Stiffness is not a property of a rigid body");
            return 0;
        }
        return impostor._pluginData.stiffness || 0;
    }

    /**
     * Sets stiffness of the impostor
     * @param impostor impostor to set stiffness on
     * @param stiffness stiffness value from 0 to 1
     */
    public setBodyStiffness(impostor: PhysicsImpostor, stiffness: number) {
        if (impostor.soft) {
            stiffness = stiffness < 0 ? 0 : stiffness;
            stiffness = stiffness > 1 ? 1 : stiffness;
            impostor.physicsBody.get_m_materials().at(0).set_m_kLST(stiffness);
            impostor._pluginData.stiffness = stiffness;
        } else {
            Logger.Warn("Stiffness cannot be applied to a rigid body");
        }
    }

    /**
     * Gets velocityIterations of the impostor
     * @param impostor impostor to get velocity iterations from
     * @returns velocityIterations value
     */
    public getBodyVelocityIterations(impostor: PhysicsImpostor): number {
        if (!impostor.soft) {
            Logger.Warn("Velocity iterations is not a property of a rigid body");
            return 0;
        }
        return impostor._pluginData.velocityIterations || 0;
    }

    /**
     * Sets velocityIterations of the impostor
     * @param impostor impostor to set velocity iterations on
     * @param velocityIterations velocityIterations value
     */
    public setBodyVelocityIterations(impostor: PhysicsImpostor, velocityIterations: number) {
        if (impostor.soft) {
            velocityIterations = velocityIterations < 0 ? 0 : velocityIterations;
            impostor.physicsBody.get_m_cfg().set_viterations(velocityIterations);
            impostor._pluginData.velocityIterations = velocityIterations;
        } else {
            Logger.Warn("Velocity iterations cannot be applied to a rigid body");
        }
    }

    /**
     * Gets positionIterations of the impostor
     * @param impostor impostor to get position iterations from
     * @returns positionIterations value
     */
    public getBodyPositionIterations(impostor: PhysicsImpostor): number {
        if (!impostor.soft) {
            Logger.Warn("Position iterations is not a property of a rigid body");
            return 0;
        }
        return impostor._pluginData.positionIterations || 0;
    }

    /**
     * Sets positionIterations of the impostor
     * @param impostor impostor to set position on
     * @param positionIterations positionIterations value
     */
    public setBodyPositionIterations(impostor: PhysicsImpostor, positionIterations: number) {
        if (impostor.soft) {
            positionIterations = positionIterations < 0 ? 0 : positionIterations;
            impostor.physicsBody.get_m_cfg().set_piterations(positionIterations);
            impostor._pluginData.positionIterations = positionIterations;
        } else {
            Logger.Warn("Position iterations cannot be applied to a rigid body");
        }
    }

    /**
     * Append an anchor to a cloth object
     * @param impostor is the cloth impostor to add anchor to
     * @param otherImpostor is the rigid impostor to anchor to
     * @param width ratio across width from 0 to 1
     * @param height ratio up height from 0 to 1
     * @param influence the elasticity between cloth impostor and anchor from 0, very stretchy to 1, little stretch
     * @param noCollisionBetweenLinkedBodies when true collisions between soft impostor and anchor are ignored; default false
     */
    public appendAnchor(
        impostor: PhysicsImpostor,
        otherImpostor: PhysicsImpostor,
        width: number,
        height: number,
        influence: number = 1,
        noCollisionBetweenLinkedBodies: boolean = false
    ) {
        const segs = impostor.segments;
        const nbAcross = Math.round((segs - 1) * width);
        const nbUp = Math.round((segs - 1) * height);
        const nbDown = segs - 1 - nbUp;
        const node = nbAcross + segs * nbDown;
        impostor.physicsBody.appendAnchor(node, otherImpostor.physicsBody, noCollisionBetweenLinkedBodies, influence);
    }

    /**
     * Append an hook to a rope object
     * @param impostor is the rope impostor to add hook to
     * @param otherImpostor is the rigid impostor to hook to
     * @param length ratio along the rope from 0 to 1
     * @param influence the elasticity between soft impostor and anchor from 0, very stretchy to 1, little stretch
     * @param noCollisionBetweenLinkedBodies when true collisions between soft impostor and anchor are ignored; default false
     */
    public appendHook(impostor: PhysicsImpostor, otherImpostor: PhysicsImpostor, length: number, influence: number = 1, noCollisionBetweenLinkedBodies: boolean = false) {
        const node = Math.round(impostor.segments * length);
        impostor.physicsBody.appendAnchor(node, otherImpostor.physicsBody, noCollisionBetweenLinkedBodies, influence);
    }

    /**
     * Sleeps the physics body and stops it from being active
     * @param impostor impostor to sleep
     */
    public sleepBody(impostor: PhysicsImpostor) {
        impostor.physicsBody.forceActivationState(0);
    }

    /**
     * Activates the physics body
     * @param impostor impostor to activate
     */
    public wakeUpBody(impostor: PhysicsImpostor) {
        impostor.physicsBody.activate();
    }

    /**
     * Updates the distance parameters of the joint
     */
    public updateDistanceJoint() {
        Logger.Warn("updateDistanceJoint is not currently supported by the Ammo physics plugin");
    }

    /**
     * Sets a motor on the joint
     * @param joint joint to set motor on
     * @param speed speed of the motor
     * @param maxForce maximum force of the motor
     */
    public setMotor(joint: IMotorEnabledJoint, speed?: number, maxForce?: number) {
        joint.physicsJoint.enableAngularMotor(true, speed, maxForce);
    }

    /**
     * Sets the motors limit
     */
    public setLimit() {
        Logger.Warn("setLimit is not currently supported by the Ammo physics plugin");
    }

    /**
     * Syncs the position and rotation of a mesh with the impostor
     * @param mesh mesh to sync
     * @param impostor impostor to update the mesh with
     */
    public syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor) {
        const body = impostor.physicsBody;

        body.getMotionState().getWorldTransform(this._tmpAmmoTransform);

        mesh.position.x = this._tmpAmmoTransform.getOrigin().x();
        mesh.position.y = this._tmpAmmoTransform.getOrigin().y();
        mesh.position.z = this._tmpAmmoTransform.getOrigin().z();

        if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.x = this._tmpAmmoTransform.getRotation().x();
            mesh.rotationQuaternion.y = this._tmpAmmoTransform.getRotation().y();
            mesh.rotationQuaternion.z = this._tmpAmmoTransform.getRotation().z();
            mesh.rotationQuaternion.w = this._tmpAmmoTransform.getRotation().w();
        }
    }

    /**
     * Gets the radius of the impostor
     * @param impostor impostor to get radius from
     * @returns the radius
     */
    public getRadius(impostor: PhysicsImpostor): number {
        const extents = impostor.getObjectExtents();
        return extents.x / 2;
    }

    /**
     * Gets the box size of the impostor
     * @param impostor impostor to get box size from
     * @param result the resulting box size
     */
    public getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void {
        const extents = impostor.getObjectExtents();
        result.x = extents.x;
        result.y = extents.y;
        result.z = extents.z;
    }

    /**
     * Disposes of the impostor
     */
    public dispose() {
        // Dispose of world
        this.bjsAMMO.destroy(this.world);
        this.bjsAMMO.destroy(this._solver);
        this.bjsAMMO.destroy(this._overlappingPairCache);
        this.bjsAMMO.destroy(this._dispatcher);
        this.bjsAMMO.destroy(this._collisionConfiguration);

        // Dispose of temp variables
        this.bjsAMMO.destroy(this._tmpAmmoVectorA);
        this.bjsAMMO.destroy(this._tmpAmmoVectorB);
        this.bjsAMMO.destroy(this._tmpAmmoVectorC);
        this.bjsAMMO.destroy(this._tmpAmmoTransform);
        this.bjsAMMO.destroy(this._tmpAmmoQuaternion);
        this.bjsAMMO.destroy(this._tmpAmmoConcreteContactResultCallback);

        this.world = null;
    }

    /**
     * Does a raycast in the physics world
     * @param from where should the ray start?
     * @param to where should the ray end?
     * @returns PhysicsRaycastResult
     */
    public raycast(from: Vector3, to: Vector3): PhysicsRaycastResult {
        this.raycastToRef(from, to, this._raycastResult);
        return this._raycastResult;
    }
    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param result resulting PhysicsRaycastResult
     */
    public raycastToRef(from: Vector3, to: Vector3, result: PhysicsRaycastResult): void {
        this._tmpAmmoVectorRCA = new this.bjsAMMO.btVector3(from.x, from.y, from.z);
        this._tmpAmmoVectorRCB = new this.bjsAMMO.btVector3(to.x, to.y, to.z);

        const rayCallback = new this.bjsAMMO.ClosestRayResultCallback(this._tmpAmmoVectorRCA, this._tmpAmmoVectorRCB);
        this.world.rayTest(this._tmpAmmoVectorRCA, this._tmpAmmoVectorRCB, rayCallback);

        result.reset(from, to);
        if (rayCallback.hasHit()) {
            // TODO: do we want/need the body? If so, set all the data
            /*
            var rigidBody = this.bjsAMMO.btRigidBody.prototype.upcast(
                rayCallback.get_m_collisionObject()
            );
            var body = {};
            */
            result.setHitData(
                {
                    x: rayCallback.get_m_hitNormalWorld().x(),
                    y: rayCallback.get_m_hitNormalWorld().y(),
                    z: rayCallback.get_m_hitNormalWorld().z(),
                },
                {
                    x: rayCallback.get_m_hitPointWorld().x(),
                    y: rayCallback.get_m_hitPointWorld().y(),
                    z: rayCallback.get_m_hitPointWorld().z(),
                }
            );
            result.calculateHitDistance();
        }
        this.bjsAMMO.destroy(rayCallback);
        this.bjsAMMO.destroy(this._tmpAmmoVectorRCA);
        this.bjsAMMO.destroy(this._tmpAmmoVectorRCB);
    }
}
