import { Quaternion, Vector3, Matrix } from "../../Maths/math";
import { IPhysicsEnginePlugin, PhysicsImpostorJoint } from "../../Physics/IPhysicsEngine";
import { Logger } from "../../Misc/logger";
import { PhysicsImpostor, IPhysicsEnabledObject } from "../../Physics/physicsImpostor";
import { PhysicsJoint, IMotorEnabledJoint, DistanceJointData } from "../../Physics/physicsJoint";
import { VertexBuffer } from "../../Meshes/buffer";
import { VertexData } from "../../Meshes/mesh.vertexData";
import { Nullable } from "../../types";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { PhysicsRaycastResult } from "../physicsRaycastResult";

declare var Ammo: any;

/**
 * AmmoJS Physics plugin
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
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

    private static readonly DISABLE_COLLISION_FLAG = 4;
    private static readonly KINEMATIC_FLAG = 2;
    private static readonly DISABLE_DEACTIVATION_FLAG = 4;

    /**
     * Initializes the ammoJS plugin
     * @param _useDeltaForWorldStep if the time between frames should be used when calculating physics steps (Default: true)
     * @param ammoInjection can be used to inject your own ammo reference
     */
    public constructor(private _useDeltaForWorldStep: boolean = true, ammoInjection: any = Ammo) {
        if (typeof ammoInjection === "function") {
            ammoInjection(this.bjsAMMO);
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
        this._overlappingPairCache = new this.bjsAMMO.btDbvtBroadphase();
        this._solver = new this.bjsAMMO.btSequentialImpulseConstraintSolver();
        this._softBodySolver = new this.bjsAMMO.btDefaultSoftBodySolver();
        this.world = new this.bjsAMMO.btSoftRigidDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration, this._softBodySolver);

        this._tmpAmmoConcreteContactResultCallback = new this.bjsAMMO.ConcreteContactResultCallback();
        this._tmpAmmoConcreteContactResultCallback.addSingleResult = () => { this._tmpContactCallbackResult = true; };

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
        for (var impostor of impostors) {
            // Update physics world objects to match babylon world
            if (!impostor.soft) {
                impostor.beforeStep();
            }
        }

        this._stepSimulation(this._useDeltaForWorldStep ? delta : this._timeStep, this._maxSteps, this._fixedTimeStep);

        for (var mainImpostor of impostors) {
            // After physics update make babylon world objects match physics world objects
            if (mainImpostor.soft) {
                this.afterSoftStep(mainImpostor);
            }
            else {
                mainImpostor.afterStep();
            }

            // Handle collision event
            if (mainImpostor._onPhysicsCollideCallbacks.length > 0) {
                if (this._isImpostorInContact(mainImpostor)) {
                    for (var collideCallback of mainImpostor._onPhysicsCollideCallbacks) {
                        for (var otherImpostor of collideCallback.otherImpostors) {
                            if (mainImpostor.physicsBody.isActive() || otherImpostor.physicsBody.isActive()) {
                                if (this._isImpostorPairInContact(mainImpostor, otherImpostor)) {
                                    mainImpostor.onCollide({ body: otherImpostor.physicsBody });
                                    otherImpostor.onCollide({ body: mainImpostor.physicsBody });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Update babylon mesh vertices vertices to match physics world object
     * @param impostor imposter to match
     */
    public afterSoftStep(impostor: PhysicsImpostor): void {
        var multiplier = 1;
        if (impostor.type === PhysicsImpostor.SoftbodyImpostor) {
            multiplier = -1;
        }
        var object = impostor.object;
        var vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
        if (!vertexPositions) {
            vertexPositions = [];
        }
        var vertexNormals = object.getVerticesData(VertexBuffer.NormalKind);
        if (!vertexNormals) {
            vertexNormals = [];
        }

        var nbVertices = vertexPositions.length / 3;
        var bodyVertices = impostor.physicsBody.get_m_nodes();
        var node: any;
        var nodePositions: any;
        var nodeNormals: any;
        var x, y, z: number;
        var nx, ny, nz: number;
        for (var n = 0; n < nbVertices; n++) {
            node = bodyVertices.at(n);
            nodePositions = node.get_m_x();
            x = nodePositions.x();
            y = nodePositions.y();
            z = multiplier * nodePositions.z();
            var nodeNormals = node.get_m_n();
            nx = nodeNormals.x();
            ny = nodeNormals.y();
            nz = multiplier * nodeNormals.z();

            vertexPositions[3 * n] = x;
            vertexPositions[3 * n + 1] = y;
            vertexPositions[3 * n + 2] = z;
            vertexNormals[3 * n] = nx;
            vertexNormals[3 * n + 1] = ny;
            vertexNormals[3 * n + 2] = nz;
        }

        var vertex_data = new VertexData();

        vertex_data.positions = vertexPositions;
        vertex_data.normals = vertexNormals;
        vertex_data.uvs = object.getVerticesData(VertexBuffer.UVKind);
        vertex_data.colors = object.getVerticesData(VertexBuffer.ColorKind);
        if (object && object.getIndices) {
            vertex_data.indices = object.getIndices();
        }

        vertex_data.applyToMesh(<Mesh>object);
    }

    private _tmpVector = new Vector3();
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
            var worldPoint = this._tmpAmmoVectorA;
            var impulse = this._tmpAmmoVectorB;

            // Convert contactPoint into world space
            if (impostor.object && impostor.object.getWorldMatrix) {
                impostor.object.getWorldMatrix().invertToRef(this._tmpMatrix);
                Vector3.TransformCoordinatesToRef(contactPoint, this._tmpMatrix, this._tmpVector);
                contactPoint = this._tmpVector;
            }

            worldPoint.setValue(contactPoint.x, contactPoint.y, contactPoint.z);
            impulse.setValue(force.x, force.y, force.z);

            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        }
        else {
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
            var worldPoint = this._tmpAmmoVectorA;
            var impulse = this._tmpAmmoVectorB;

            // Convert contactPoint into world space
            if (impostor.object && impostor.object.getWorldMatrix) {
                impostor.object.getWorldMatrix().invertToRef(this._tmpMatrix);
                Vector3.TransformCoordinatesToRef(contactPoint, this._tmpMatrix, this._tmpVector);
                contactPoint = this._tmpVector;
            }

            worldPoint.setValue(contactPoint.x, contactPoint.y, contactPoint.z);
            impulse.setValue(force.x, force.y, force.z);

            impostor.physicsBody.applyForce(impulse, worldPoint);
        }
        else {
            Logger.Warn("Cannot be applied to a soft body");
        }
    }

    /**
     * Creates a physics body using the plugin
     * @param impostor the imposter to create the physics body on
     */
    public generatePhysicsBody(impostor: PhysicsImpostor) {
        impostor._pluginData = { toDispose: [] };

        //parent-child relationship
        if (impostor.parent) {
            if (impostor.physicsBody) {
                this.removePhysicsBody(impostor);
                impostor.forceUpdate();
            }
            return;
        }

        if (impostor.isBodyInitRequired()) {
            var colShape = this._createShape(impostor);
            var mass = impostor.getParam("mass");
            impostor._pluginData.mass = mass;
            if (impostor.soft) {
                colShape.get_m_cfg().set_collisions(0x11);
                colShape.get_m_cfg().set_kDP(impostor.getParam("damping"));
                Ammo.castObject(colShape, Ammo.btCollisionObject).getCollisionShape().setMargin(impostor.getParam("margin"));
                colShape.setActivationState(AmmoJSPlugin.DISABLE_DEACTIVATION_FLAG);
                this.world.addSoftBody(colShape, 1, -1);
                impostor.physicsBody = colShape;
                impostor._pluginData.toDispose.concat([colShape]);
                this.setBodyPressure(impostor, 0);
                if (impostor.type === PhysicsImpostor.SoftbodyImpostor) {
                    this.setBodyPressure(impostor, impostor.getParam("pressure"));
                }
                this.setBodyStiffness(impostor, impostor.getParam("stiffness"));
                this.setBodyVelocityIterations(impostor, impostor.getParam("velocityIterations"));
                this.setBodyPositionIterations(impostor, impostor.getParam("positionIterations"));
            }
            else {
                var localInertia = new Ammo.btVector3(0, 0, 0);
                var startTransform = new Ammo.btTransform();
                startTransform.setIdentity();
                if (mass !== 0) {
                    colShape.calculateLocalInertia(mass, localInertia);
                }
                this._tmpAmmoVectorA.setValue(impostor.object.position.x, impostor.object.position.y, impostor.object.position.z);
                this._tmpAmmoQuaternion.setValue(impostor.object.rotationQuaternion!.x, impostor.object.rotationQuaternion!.y, impostor.object.rotationQuaternion!.z, impostor.object.rotationQuaternion!.w);
                startTransform.setOrigin(this._tmpAmmoVectorA);
                startTransform.setRotation(this._tmpAmmoQuaternion);
                var myMotionState = new Ammo.btDefaultMotionState(startTransform);
                var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia);
                var body = new Ammo.btRigidBody(rbInfo);

                // Make objects kinematic if it's mass is 0
                if (mass === 0) {
                    body.setCollisionFlags(body.getCollisionFlags() | AmmoJSPlugin.KINEMATIC_FLAG);
                    body.setActivationState(AmmoJSPlugin.DISABLE_DEACTIVATION_FLAG);
                }

                // Disable collision if NoImpostor, but keep collision if shape is btCompoundShape
                if (impostor.type == PhysicsImpostor.NoImpostor && !colShape.getChildShape) {
                    body.setCollisionFlags(body.getCollisionFlags() | AmmoJSPlugin.DISABLE_COLLISION_FLAG);
                }

                this.world.addRigidBody(body);
                impostor.physicsBody = body;
                impostor._pluginData.toDispose.concat([body, rbInfo, myMotionState, startTransform, localInertia, colShape]);
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
            this.world.removeRigidBody(impostor.physicsBody);

            impostor._pluginData.toDispose.forEach((d: any) => {
                this.bjsAMMO.destroy(d);
            });
        }
    }

    /**
     * Generates a joint
     * @param impostorJoint the imposter joint to create the joint with
     */
    public generateJoint(impostorJoint: PhysicsImpostorJoint) {
        var mainBody = impostorJoint.mainImpostor.physicsBody;
        var connectedBody = impostorJoint.connectedImpostor.physicsBody;
        if (!mainBody || !connectedBody) {
            return;
        }

        var jointData = impostorJoint.joint.jointData;
        if (!jointData.mainPivot) {
            jointData.mainPivot = new Vector3(0, 0, 0);
        }
        if (!jointData.connectedPivot) {
            jointData.connectedPivot = new Vector3(0, 0, 0);
        }

        var joint: any;
        switch (impostorJoint.joint.type) {
            case PhysicsJoint.DistanceJoint:
                var distance = (<DistanceJointData>jointData).maxDistance;
                if (distance) {
                    jointData.mainPivot = new Vector3(0, -distance / 2, 0);
                    jointData.connectedPivot = new Vector3(0, distance / 2, 0);
                }
                joint = new Ammo.btPoint2PointConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                break;
            case PhysicsJoint.HingeJoint:
                if (!jointData.mainAxis) {
                    jointData.mainAxis = new Vector3(0, 0, 0);
                }
                if (!jointData.connectedAxis) {
                    jointData.connectedAxis = new Vector3(0, 0, 0);
                }
                var mainAxis = new Ammo.btVector3(jointData.mainAxis.x, jointData.mainAxis.y, jointData.mainAxis.z);
                var connectedAxis = new Ammo.btVector3(jointData.connectedAxis.x, jointData.connectedAxis.y, jointData.connectedAxis.z);
                joint = new Ammo.btHingeConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z), mainAxis, connectedAxis);
                break;
            case PhysicsJoint.BallAndSocketJoint:
                joint = new Ammo.btPoint2PointConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                break;
            default:
                Logger.Warn("JointType not currently supported by the Ammo plugin, falling back to PhysicsJoint.BallAndSocketJoint");
                joint = new Ammo.btPoint2PointConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
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
        var triangleCount = 0;
        if (object && object.getIndices && object.getWorldMatrix && object.getChildMeshes) {
            var indices = object.getIndices();
            if (!indices) {
                indices = [];
            }
            var vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
            if (!vertexPositions) {
                vertexPositions = [];
            }
            object.computeWorldMatrix(false);
            var faceCount = indices.length / 3;
            for (var i = 0; i < faceCount; i++) {
                var triPoints = [];
                for (var point = 0; point < 3; point++) {
                    var v = new Vector3(vertexPositions[(indices[(i * 3) + point] * 3) + 0], vertexPositions[(indices[(i * 3) + point] * 3) + 1], vertexPositions[(indices[(i * 3) + point] * 3) + 2]);
                    v = Vector3.TransformCoordinates(v, object.getWorldMatrix());
                    v.subtractInPlace(topLevelObject.position);
                    var vec: any;
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
     */
    private _softVertexData(impostor: PhysicsImpostor) : VertexData {
        var object = impostor.object;
        if (object && object.getIndices && object.getWorldMatrix && object.getChildMeshes) {
            var indices = object.getIndices();
            if (!indices) {
                indices = [];
            }
            var vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
            if (!vertexPositions) {
                vertexPositions = [];
            }
            var vertexNormals = object.getVerticesData(VertexBuffer.NormalKind);
            if (!vertexNormals) {
                vertexNormals = [];
            }
            object.computeWorldMatrix(false);
            var newPoints = [];
            var newNorms = [];
            for (var i = 0; i < vertexPositions.length; i += 3) {
                    var v = new Vector3(vertexPositions[i], vertexPositions[i + 1], vertexPositions[i + 2]);
                    var n = new Vector3(vertexNormals[i], vertexNormals[i + 1], vertexNormals[i + 2]);
                    v = Vector3.TransformCoordinates(v, object.getWorldMatrix());
                    n = Vector3.TransformNormal(n, object.getWorldMatrix());
                    newPoints.push(v.x, v.y, v.z);
                    newNorms.push(n.x, n.y, n.z);
            }

            var vertex_data = new VertexData();

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
     */
    private _createSoftbody(impostor: PhysicsImpostor) {
        var object = impostor.object;
        if (object && object.getIndices) {
            var indices = object.getIndices();
            if (!indices) {
                indices = [];
            }

            var vertex_data = this._softVertexData(impostor);
            var vertexPositions = vertex_data.positions;
            var vertexNormals = vertex_data.normals;

            if (vertexPositions === null  || vertexNormals === null) {
                return new Ammo.btCompoundShape();
            }
            else {
                var triPoints = [];
                var triNorms = [];
                for (var i = 0; i < vertexPositions.length; i += 3) {
                    var v = new Vector3(vertexPositions[i], vertexPositions[i + 1], vertexPositions[i + 2]);
                    var n = new Vector3(vertexNormals[i], vertexNormals[i + 1], vertexNormals[i + 2]);
                    triPoints.push(v.x, v.y, -v.z);
                    triNorms.push(n.x, n.y, -n.z);
                }
                var softBody = new Ammo.btSoftBodyHelpers().CreateFromTriMesh(
                    this.world.getWorldInfo(),
                    triPoints,
                    object.getIndices(),
                    indices.length / 3,
                    true
                );

                var nbVertices = vertexPositions.length / 3;
                var bodyVertices = softBody.get_m_nodes();
                var node: any;
                var nodeNormals: any;
                for (var i = 0; i < nbVertices; i++) {
                    node = bodyVertices.at(i);
                    var nodeNormals = node.get_m_n();
                    nodeNormals.setX(triNorms[3 * i]);
                    nodeNormals.setY(triNorms[3 * i + 1]);
                    nodeNormals.setZ(triNorms[3 * i + 2]);
                }
                softBody.get_m_cfg().set_collisions(0x11);
                return softBody;
            }
        }
    }

    /**
     * Create cloth for an impostor
     * @param impostor to create the softbody for
     */
    private _createCloth(impostor: PhysicsImpostor) {
        var object = impostor.object;
        if (object && object.getIndices) {
            var indices = object.getIndices();
            if (!indices) {
                indices = [];
            }

            var vertex_data = this._softVertexData(impostor);
            var vertexPositions = vertex_data.positions;
            var vertexNormals = vertex_data.normals;

            if (vertexPositions === null  || vertexNormals === null) {
                return new Ammo.btCompoundShape();
            }
            else {
                var len = vertexPositions.length;
                var segments = Math.sqrt(len / 3);
                impostor.segments = segments - 1;
                var segs = segments - 1;
                this._tmpAmmoVectorA.setValue(vertexPositions[0], vertexPositions[1], vertexPositions[2]);
                this._tmpAmmoVectorB.setValue(vertexPositions[3 * segs], vertexPositions[3 * segs + 1], vertexPositions[3 * segs + 2]);
                this._tmpAmmoVectorD.setValue(vertexPositions[len - 3], vertexPositions[len - 2], vertexPositions[len - 1]);
                this._tmpAmmoVectorC.setValue(vertexPositions[len - 3 - 3 * segs], vertexPositions[len - 2 - 3 * segs], vertexPositions[len - 1 - 3 * segs]);

                var clothBody = new Ammo.btSoftBodyHelpers().CreatePatch(
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
                clothBody.get_m_cfg().set_collisions(0x11);
                return clothBody;
            }
        }
    }

    // adds all verticies (including child verticies) to the convex hull shape
    private _addHullVerts(btConvexHullShape: any, topLevelObject: IPhysicsEnabledObject, object: IPhysicsEnabledObject) {
        var triangleCount = 0;
        if (object && object.getIndices && object.getWorldMatrix && object.getChildMeshes) {
            var indices = object.getIndices();
            if (!indices) {
                indices = [];
            }
            var vertexPositions = object.getVerticesData(VertexBuffer.PositionKind);
            if (!vertexPositions) {
                vertexPositions = [];
            }
            object.computeWorldMatrix(false);
            var faceCount = indices.length / 3;
            for (var i = 0; i < faceCount; i++) {
                var triPoints = [];
                for (var point = 0; point < 3; point++) {
                    var v = new Vector3(vertexPositions[(indices[(i * 3) + point] * 3) + 0], vertexPositions[(indices[(i * 3) + point] * 3) + 1], vertexPositions[(indices[(i * 3) + point] * 3) + 2]);
                    v = Vector3.TransformCoordinates(v, object.getWorldMatrix());
                    v.subtractInPlace(topLevelObject.position);
                    var vec: any;
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
        var object = impostor.object;

        var returnValue: any;
        var extendSize = impostor.getObjectExtendSize();

        if (!ignoreChildren) {
            var meshChildren = impostor.object.getChildMeshes ? impostor.object.getChildMeshes(true) : [];
            returnValue = new Ammo.btCompoundShape();

            // Add shape of all children to the compound shape
            var childrenAdded = 0;
            meshChildren.forEach((childMesh) => {
                var childImpostor = childMesh.getPhysicsImpostor();
                if (childImpostor) {
                    var shape = this._createShape(childImpostor);

                    // Position needs to be scaled based on parent's scaling
                    var parentMat = childMesh.parent!.getWorldMatrix().clone();
                    var s = new Vector3();
                    parentMat.decompose(s);
                    this._tmpAmmoTransform.getOrigin().setValue(childMesh.position.x * s.x, childMesh.position.y * s.y, childMesh.position.z * s.z);

                    this._tmpAmmoQuaternion.setValue(childMesh.rotationQuaternion!.x, childMesh.rotationQuaternion!.y, childMesh.rotationQuaternion!.z, childMesh.rotationQuaternion!.w);
                    this._tmpAmmoTransform.setRotation(this._tmpAmmoQuaternion);
                    returnValue.addChildShape(this._tmpAmmoTransform, shape);
                    childImpostor.dispose();
                    childrenAdded++;
                }
            });

            if (childrenAdded > 0) {
                // Add parents shape as a child if present
                if (impostor.type != PhysicsImpostor.NoImpostor) {
                    var shape = this._createShape(impostor, true);
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
                Ammo.destroy(returnValue);
                returnValue = null;
            }
        }

        switch (impostor.type) {
            case PhysicsImpostor.SphereImpostor:
                returnValue = new Ammo.btSphereShape(extendSize.x / 2);
                break;
            case PhysicsImpostor.CylinderImpostor:
                this._tmpAmmoVectorA.setValue(extendSize.x / 2, extendSize.y / 2, extendSize.z / 2);
                returnValue = new Ammo.btCylinderShape(this._tmpAmmoVectorA);
                break;
            case PhysicsImpostor.PlaneImpostor:
            case PhysicsImpostor.BoxImpostor:
                this._tmpAmmoVectorA.setValue(extendSize.x / 2, extendSize.y / 2, extendSize.z / 2);
                returnValue = new Ammo.btBoxShape(this._tmpAmmoVectorA);
                break;
            case PhysicsImpostor.MeshImpostor:
                var tetraMesh = new Ammo.btTriangleMesh();
                impostor._pluginData.toDispose.concat([tetraMesh]);
                var triangeCount = this._addMeshVerts(tetraMesh, object, object);
                if (triangeCount == 0) {
                    returnValue = new Ammo.btCompoundShape();
                } else {
                    returnValue = new Ammo.btBvhTriangleMeshShape(tetraMesh);
                }
                break;
            case PhysicsImpostor.ConvexHullImpostor:
                var convexMesh = new Ammo.btConvexHullShape();
                var triangeCount = this._addHullVerts(convexMesh, object, object);
                if (triangeCount == 0) {
                    // Cleanup Unused Convex Hull Shape
                    impostor._pluginData.toDispose.concat([convexMesh]);
                    returnValue = new Ammo.btCompoundShape();
                } else {
                    returnValue = convexMesh;
                }
                break;
            case PhysicsImpostor.NoImpostor:
                // Fill with sphere but collision is disabled on the rigid body in generatePhysicsBody, using an empty shape caused unexpected movement with joints
                returnValue = new Ammo.btSphereShape(extendSize.x / 2);
                break;
            case PhysicsImpostor.SoftbodyImpostor:
                // Only usable with a mesh that has sufficient and shared vertices
                returnValue = this._createSoftbody(impostor);
                break;
            case PhysicsImpostor.ClothImpostor:
                // Only usable with a mesh that has sufficient and shared vertices
                returnValue = this._createCloth(impostor);
                break;
            default:
                Logger.Warn("The impostor type is not currently supported by the ammo plugin.");
                break;
        }

        return returnValue;
    }

    /**
     * Sets the physics body position/rotation from the babylon mesh's position/rotation
     * @param impostor imposter containing the physics body and babylon object
     */
    public setTransformationFromPhysicsBody(impostor: PhysicsImpostor) {
        impostor.physicsBody.getMotionState().getWorldTransform(this._tmpAmmoTransform);
        impostor.object.position.set(this._tmpAmmoTransform.getOrigin().x(), this._tmpAmmoTransform.getOrigin().y(), this._tmpAmmoTransform.getOrigin().z());

        if (!impostor.object.rotationQuaternion) {
            if (impostor.object.rotation) {
                this._tmpQuaternion.set(this._tmpAmmoTransform.getRotation().x(), this._tmpAmmoTransform.getRotation().y(), this._tmpAmmoTransform.getRotation().z(), this._tmpAmmoTransform.getRotation().w());
                this._tmpQuaternion.toEulerAnglesToRef(impostor.object.rotation);
            }
        } else {
            impostor.object.rotationQuaternion.set(this._tmpAmmoTransform.getRotation().x(), this._tmpAmmoTransform.getRotation().y(), this._tmpAmmoTransform.getRotation().z(), this._tmpAmmoTransform.getRotation().w());
        }
    }

    /**
     * Sets the babylon object's position/rotation from the physics body's position/rotation
     * @param impostor imposter containing the physics body and babylon object
     * @param newPosition new position
     * @param newRotation new rotation
     */
    public setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion) {
        var trans = impostor.physicsBody.getWorldTransform();

        // If rotation/position has changed update and activate riged body
        if (
            trans.getOrigin().x() != newPosition.x ||
            trans.getOrigin().y() != newPosition.y ||
            trans.getOrigin().z() != newPosition.z ||
            trans.getRotation().x() != newRotation.x ||
            trans.getRotation().y() != newRotation.y ||
            trans.getRotation().z() != newRotation.z ||
            trans.getRotation().w() != newRotation.w
        ) {
            this._tmpAmmoVectorA.setValue(newPosition.x, newPosition.y, newPosition.z);
            trans.setOrigin(this._tmpAmmoVectorA);

            this._tmpAmmoQuaternion.setValue(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
            trans.setRotation(this._tmpAmmoQuaternion);
            impostor.physicsBody.setWorldTransform(trans);

            if (impostor.mass == 0) {
                // Kinematic objects must be updated using motion state
                var motionState = impostor.physicsBody.getMotionState();
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
        }
        else {
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
        }
        else {
            impostor.physicsBody.setAngularVelocity(this._tmpAmmoVectorA);
        }
    }

    /**
     * gets the linear velocity
     * @param impostor imposter to get linear velocity from
     * @returns linear velocity
     */
    public getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
        if (impostor.soft) {
            var v = impostor.physicsBody.linearVelocity();
        }
        else {
            var v = impostor.physicsBody.getLinearVelocity();
        }
        if (!v) {
            return null;
        }
        return new Vector3(v.x(), v.y(), v.z());
    }

    /**
     * gets the angular velocity
     * @param impostor imposter to get angular velocity from
     * @returns angular velocity
     */
    public getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
        if (impostor.soft) {
            var v = impostor.physicsBody.angularVelocity();
        }
        else {
            var v = impostor.physicsBody.getAngularVelocity();
        }
        if (!v) {
            return null;
        }
        return new Vector3(v.x(), v.y(), v.z());
    }

    /**
     * Sets the mass of physics body
     * @param impostor imposter to set the mass on
     * @param mass mass to set
     */
    public setBodyMass(impostor: PhysicsImpostor, mass: number) {
        if (impostor.soft) {
            impostor.physicsBody.setTotalMass(mass, false);
        }
        else {
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
        return impostor._pluginData.mass;
    }

    /**
     * Gets friction of the impostor
     * @param impostor impostor to get friction from
     * @returns friction value
     */
    public getBodyFriction(impostor: PhysicsImpostor): number {
        return impostor._pluginData.friction;
    }

    /**
     * Sets friction of the impostor
     * @param impostor impostor to set friction on
     * @param friction friction value
     */
    public setBodyFriction(impostor: PhysicsImpostor, friction: number) {
        if (impostor.soft) {
            impostor.physicsBody.get_m_cfg().set_kDF(friction);
        }
        else {
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
        return impostor._pluginData.restitution;
    }

    /**
     * Sets resitution of the impostor
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
        return impostor._pluginData.pressure;
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
            }
            else {
                impostor.physicsBody.get_m_cfg().set_kPR(0);
                impostor._pluginData.pressure = 0;
            }
        }
        else {
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
        return impostor._pluginData.stiffness;
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
        }
        else {
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
        return impostor._pluginData.velocityIterations;
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
        }
        else {
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
        return impostor._pluginData.positionIterations;
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
        }
        else {
            Logger.Warn("Position iterations cannot be applied to a rigid body");
        }
    }

     /**
     * Append an anchor to a soft object
     * @param impostor, soft impostor to add anchor to
     * @param otherImpostor, rigid impostor as the anchor
     * @param width, ratio across width from 0 to 1
     * @param height, ratio up height from 0 to 1
     * @param influenece, the elasticity between soft impostor and anchor from 0, very stretchy to 1, no strech
     * @param noCollisionBetweenLinkedBodies, when true collisions between soft impostor and anchor are ignored; default false
     */
    public appendAnchor(impostor: PhysicsImpostor, otherImpostor: PhysicsImpostor, width: number, height: number, influence: number = 1, noCollisionBetweenLinkedBodies: boolean = false) {
        var segs = impostor.segments;
        var nbAcross = Math.round(segs * width);
        var nbUp = Math.round(segs * height);
        var nbDown = segs - nbUp;
        var node = nbAcross + segs * nbDown;
        impostor.physicsBody.appendAnchor(node, otherImpostor.physicsBody, noCollisionBetweenLinkedBodies, influence);
    }

    /**
     * Sleeps the physics body and stops it from being active
     * @param impostor impostor to sleep
     */
    public sleepBody(impostor: PhysicsImpostor) {
        Logger.Warn("sleepBody is not currently supported by the Ammo physics plugin");
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
     * @param joint joint to update
     * @param maxDistance maximum distance of the joint
     * @param minDistance minimum distance of the joint
     */
    public updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number) {
        Logger.Warn("updateDistanceJoint is not currently supported by the Ammo physics plugin");
    }

    /**
     * Sets a motor on the joint
     * @param joint joint to set motor on
     * @param speed speed of the motor
     * @param maxForce maximum force of the motor
     * @param motorIndex index of the motor
     */
    public setMotor(joint: IMotorEnabledJoint, speed?: number, maxForce?: number, motorIndex?: number) {
        joint.physicsJoint.enableAngularMotor(true, speed, maxForce);
    }

    /**
     * Sets the motors limit
     * @param joint joint to set limit on
     * @param upperLimit upper limit
     * @param lowerLimit lower limit
     */
    public setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number) {
        Logger.Warn("setLimit is not currently supported by the Ammo physics plugin");
    }

    /**
     * Syncs the position and rotation of a mesh with the impostor
     * @param mesh mesh to sync
     * @param impostor impostor to update the mesh with
     */
    public syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor) {
        var body = impostor.physicsBody;

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
        var exntend = impostor.getObjectExtendSize();
        return exntend.x / 2;
    }

    /**
     * Gets the box size of the impostor
     * @param impostor impostor to get box size from
     * @param result the resulting box size
     */
    public getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void {
        var exntend = impostor.getObjectExtendSize();
        result.x = exntend.x;
        result.y = exntend.y;
        result.z = exntend.z;
    }

    /**
     * Disposes of the impostor
     */
    public dispose() {
        // Dispose of world
        Ammo.destroy(this.world);
        Ammo.destroy(this._solver);
        Ammo.destroy(this._overlappingPairCache);
        Ammo.destroy(this._dispatcher);
        Ammo.destroy(this._collisionConfiguration);

        // Dispose of tmp variables
        Ammo.destroy(this._tmpAmmoVectorA);
        Ammo.destroy(this._tmpAmmoVectorB);
        Ammo.destroy(this._tmpAmmoVectorC);
        Ammo.destroy(this._tmpAmmoTransform);
        Ammo.destroy(this._tmpAmmoQuaternion);
        Ammo.destroy(this._tmpAmmoConcreteContactResultCallback);

        this.world = null;
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    public raycast(from: Vector3, to: Vector3): PhysicsRaycastResult {
        this._tmpAmmoVectorRCA = new this.bjsAMMO.btVector3(from.x, from.y, from.z);
        this._tmpAmmoVectorRCB = new this.bjsAMMO.btVector3(to.x, to.y, to.z);

        var rayCallback = new this.bjsAMMO.ClosestRayResultCallback(this._tmpAmmoVectorRCA, this._tmpAmmoVectorRCB);
        this.world.rayTest(this._tmpAmmoVectorRCA, this._tmpAmmoVectorRCB, rayCallback);

        this._raycastResult.reset(from, to);
        if (rayCallback.hasHit()) {
            // TODO: do we want/need the body? If so, set all the data
            /*
            var rigidBody = this.bjsAMMO.btRigidBody.prototype.upcast(
                rayCallback.get_m_collisionObject()
            );
            var body = {};
            */
            this._raycastResult.setHitData(
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
            this._raycastResult.calculateHitDistance();
        }

        return this._raycastResult;
    }
}
