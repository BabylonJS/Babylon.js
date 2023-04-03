import type { IPhysicsCollisionEvent, IPhysicsEnginePluginV2, MassProperties, PhysicsMotionType } from "./IPhysicsEnginePlugin";
import type { PhysicsShape } from "./physicsShape";
import { Vector3, Quaternion, TmpVectors } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import type { PhysicsEngine } from "./physicsEngine";
import type { Mesh, TransformNode, AbstractMesh } from "../../Meshes";
import type { Nullable } from "core/types";
import type { PhysicsConstraint } from "./physicsConstraint";
import type { Bone } from "core/Bones/bone";
import { Space } from "core/Maths/math.axis";
import type { Observable, Observer } from "../../Misc/observable";
import type { Node } from "../../node";

/**
 * PhysicsBody is useful for creating a physics body that can be used in a physics engine. It allows
 * the user to set the mass and velocity of the body, which can then be used to calculate the
 * motion of the body in the physics engine.
 */
export class PhysicsBody {
    /**
     * V2 Physics plugin private data for single Transform
     */
    public _pluginData: any = undefined;
    /**
     * V2 Physics plugin private data for instances
     */
    public _pluginDataInstances: Array<any> = [];
    /**
     * The V2 plugin used to create and manage this Physics Body
     */
    private _physicsPlugin: IPhysicsEnginePluginV2;
    /**
     * The engine used to create and manage this Physics Body
     */
    private _physicsEngine: PhysicsEngine;
    /**
     * The transform node associated with this Physics Body
     */
    transformNode: TransformNode;
    /**
     * Disable pre-step that consists in updating Physics Body from Transform Node Translation/Orientation.
     * True by default for maximum performance.
     */
    disablePreStep: boolean = true;

    private static _DEFAULT_OBJECT_SIZE: Vector3 = new Vector3(1, 1, 1);
    private static _IDENTITY_QUATERNION = Quaternion.Identity();
    private _nodeDisposeObserver: Nullable<Observer<Node>>;

    /**
     * Constructs a new physics body for the given node.
     * @param transformNode - The Transform Node to construct the physics body for.
     * @param motionType - The motion type of the physics body.
     * @param scene - The scene containing the physics engine.
     *
     * This code is useful for creating a physics body for a given Transform Node in a scene.
     * It checks the version of the physics engine and the physics plugin, and initializes the body accordingly.
     * It also sets the node's rotation quaternion if it is not already set. Finally, it adds the body to the physics engine.
     */
    constructor(transformNode: TransformNode, motionType: PhysicsMotionType, scene: Scene) {
        if (!scene) {
            return;
        }
        const physicsEngine = scene.getPhysicsEngine() as PhysicsEngine;
        if (!physicsEngine) {
            throw new Error("No Physics Engine available.");
        }
        this._physicsEngine = physicsEngine;
        if (physicsEngine.getPluginVersion() != 2) {
            throw new Error("Plugin version is incorrect. Expected version 2.");
        }
        const physicsPlugin = physicsEngine.getPhysicsPlugin();
        if (!physicsPlugin) {
            throw new Error("No Physics Plugin available.");
        }

        this._physicsPlugin = physicsPlugin as IPhysicsEnginePluginV2;
        if (!transformNode.rotationQuaternion) {
            transformNode.rotationQuaternion = Quaternion.FromEulerAngles(transformNode.rotation.x, transformNode.rotation.y, transformNode.rotation.z);
        }
        // instances?
        const m = transformNode as Mesh;
        if (m.hasThinInstances) {
            this._physicsPlugin.initBodyInstances(this, motionType, m);
        } else {
            // single instance
            this._physicsPlugin.initBody(this, motionType, transformNode.position, transformNode.rotationQuaternion);
        }
        this.transformNode = transformNode;
        transformNode.physicsBody = this;
        physicsEngine.addBody(this);

        this._nodeDisposeObserver = transformNode.onDisposeObservable.add(() => {
            this.dispose();
        });
    }

    /**
     * Clone the PhysicsBody to a new body and assign it to the transformNode parameter
     * @param transformNode transformNode that will be used for the cloned PhysicsBody
     * @returns the newly cloned PhysicsBody
     */
    public clone(transformNode: TransformNode): PhysicsBody {
        const clonedBody = new PhysicsBody(transformNode, this.motionType, this.transformNode.getScene());
        clonedBody.shape = this.shape;
        return clonedBody;
    }

    /**
     * If a physics body is connected to an instanced node, update the number physic instances to match the number of node instances.
     */
    public updateBodyInstances() {
        const m = this.transformNode as Mesh;
        if (m.hasThinInstances) {
            this._physicsPlugin.updateBodyInstances(this, m);
        }
    }

    /**
     * Adds the physics shape associated with the transform node to this body
     * @param shapeNode - A node with a physics shape. Should be a child of the body node
     */
    public addNodeShape(shapeNode: TransformNode) {
        this._physicsPlugin.addNodeShape(this, shapeNode);
    }

    /**
     * Sets the shape of the physics body.
     * @param shape - The shape of the physics body.
     *
     * This method is useful for setting the shape of the physics body, which is necessary for the physics engine to accurately simulate the body's behavior.
     * The shape is used to calculate the body's mass, inertia, and other properties.
     */
    public set shape(shape: PhysicsShape) {
        this._physicsPlugin.setShape(this, shape);
    }

    /**
     * Retrieves the physics shape associated with this object.
     *
     * @returns The physics shape associated with this object, or `undefined` if no
     * shape is associated.
     *
     * This method is useful for retrieving the physics shape associated with this object,
     * which can be used to apply physical forces to the object or to detect collisions.
     */
    public get shape(): PhysicsShape {
        return this._physicsPlugin.getShape(this);
    }

    /**
     * Sets the filter group of the physics body.
     * @param group - The filter group of the physics body.
     *
     * This method is useful for setting the filter group of the physics body.
     * The filter group is used to determine which bodies should collide with each other.
     * This allows for more control over the physics engine and can be used to create more realistic simulations.
     */
    public set filterGroup(group: number) {
        this._physicsPlugin.setFilterGroup(this, group);
    }

    /**
     * Gets the filter group of the physics engine.
     *
     * @returns The filter group of the physics engine.
     *
     * This method is useful for getting the filter group of the physics engine,
     * which is used to determine which objects will interact with each other.
     * This is important for creating realistic physics simulations.
     */
    public get filterGroup(): number {
        return this._physicsPlugin.getFilterGroup(this);
    }

    /**
     * Sets the event mask for the physics engine.
     *
     * @param eventMask - A bitmask that determines which events will be sent to the physics engine.
     *
     * This method is useful for setting the event mask for the physics engine, which determines which events
     * will be sent to the physics engine. This allows the user to control which events the physics engine will respond to.
     */
    public set eventMask(eventMask: number) {
        this._physicsPlugin.setEventMask(this, eventMask);
    }

    /**
     * Gets the event mask of the physics engine.
     *
     * @returns The event mask of the physics engine.
     *
     * This method is useful for getting the event mask of the physics engine,
     * which is used to determine which events the engine will respond to.
     * This is important for ensuring that the engine is responding to the correct events and not
     * wasting resources on unnecessary events.
     */
    public get eventMask(): number {
        return this._physicsPlugin.getEventMask(this);
    }

    /**
     * Sets the motion type of the physics body. Can be STATIC, DYNAMIC, or ANIMATED.
     */
    public set motionType(motionType: PhysicsMotionType) {
        this._physicsPlugin.setMotionType(this, motionType);
    }

    /**
     * Gets the motion type of the physics body. Can be STATIC, DYNAMIC, or ANIMATED.
     */
    public get motionType(): PhysicsMotionType {
        return this._physicsPlugin.getMotionType(this);
    }

    /**
     * Computes the mass properties of the physics object, based on the set of physics shapes this body uses.
     * This method is useful for computing the initial mass properties of a physics object, such as its mass,
     * inertia, and center of mass; these values are important for accurately simulating the physics of the
     * object in the physics engine, and computing values based on the shape will provide you with reasonable
     * intial values, which you can then customize.
     */
    public computeMassProperties(): MassProperties {
        return this._physicsPlugin.computeMassProperties(this);
    }

    /**
     * Sets the mass properties of the physics object.
     *
     * @param massProps - The mass properties to set.
     *
     * This method is useful for setting the mass properties of a physics object, such as its mass,
     * inertia, and center of mass. This is important for accurately simulating the physics of the object in the physics engine.
     */
    public set massProperties(massProps: MassProperties) {
        this._physicsPlugin.setMassProperties(this, massProps);
    }

    /**
     * Retrieves the mass properties of the object.
     *
     * @returns The mass properties of the object.
     *
     * This method is useful for physics simulations, as it allows the user to
     * retrieve the mass properties of the object, such as its mass, center of mass,
     * and moment of inertia. This information is necessary for accurate physics
     * simulations.
     */
    public get massProperties(): MassProperties {
        return this._physicsPlugin.getMassProperties(this);
    }

    /**
     * Sets the linear damping of the physics body.
     *
     * @param damping - The linear damping value.
     *
     * This method is useful for controlling the linear damping of the physics body,
     * which is the rate at which the body's velocity decreases over time. This is useful for simulating
     * the effects of air resistance or other forms of friction.
     */
    public set linearDamping(damping: number) {
        this._physicsPlugin.setLinearDamping(this, damping);
    }

    /**
     * Gets the linear damping of the physics body.
     * @returns The linear damping of the physics body.
     *
     * This method is useful for retrieving the linear damping of the physics body, which is the amount of
     * resistance the body has to linear motion. This is useful for simulating realistic physics behavior
     * in a game.
     */
    public get linearDamping(): number {
        return this._physicsPlugin.getLinearDamping(this);
    }

    /**
     * Sets the angular damping of the physics body.
     * @param damping The angular damping of the body.
     *
     * This method is useful for controlling the angular velocity of a physics body.
     * By setting the damping, the body's angular velocity will be reduced over time, simulating the effect of friction.
     * This can be used to create realistic physical behavior in a physics engine.
     */
    public set angularDamping(damping: number) {
        this._physicsPlugin.setAngularDamping(this, damping);
    }

    /**
     * Gets the angular damping of the physics body.
     *
     * @returns The angular damping of the physics body.
     *
     * This method is useful for getting the angular damping of the physics body,
     * which is the rate of reduction of the angular velocity over time.
     * This is important for simulating realistic physics behavior in a game.
     */
    public get angularDamping(): number {
        return this._physicsPlugin.getAngularDamping(this);
    }

    /**
     * Sets the linear velocity of the physics object.
     * @param linVel - The linear velocity to set.
     *
     * This method is useful for setting the linear velocity of a physics object,
     * which is necessary for simulating realistic physics in a game engine.
     * By setting the linear velocity, the physics object will move in the direction and speed specified by the vector.
     * This allows for realistic physics simulations, such as simulating the motion of a ball rolling down a hill.
     */
    public setLinearVelocity(linVel: Vector3): void {
        this._physicsPlugin.setLinearVelocity(this, linVel);
    }

    /**
     * Gets the linear velocity of the physics body and stores it in the given vector3.
     * @param linVel - The vector3 to store the linear velocity in.
     *
     * This method is useful for getting the linear velocity of a physics body in a physics engine.
     * This can be used to determine the speed and direction of the body, which can be used to calculate the motion of the body.*/
    public getLinearVelocityToRef(linVel: Vector3): void {
        return this._physicsPlugin.getLinearVelocityToRef(this, linVel);
    }

    /**
     * Sets the angular velocity of the physics object.
     * @param angVel - The angular velocity to set.
     *
     * This method is useful for setting the angular velocity of a physics object, which is necessary for
     * simulating realistic physics behavior. The angular velocity is used to determine the rate of rotation of the object,
     * which is important for simulating realistic motion.
     */
    public setAngularVelocity(angVel: Vector3): void {
        this._physicsPlugin.setAngularVelocity(this, angVel);
    }

    /**
     * Gets the angular velocity of the physics body and stores it in the given vector3.
     * @param angVel - The vector3 to store the angular velocity in.
     *
     * This method is useful for getting the angular velocity of a physics body, which can be used to determine the body's
     * rotational speed. This information can be used to create realistic physics simulations.
     */
    public getAngularVelocityToRef(angVel: Vector3): void {
        return this._physicsPlugin.getAngularVelocityToRef(this, angVel);
    }

    /**
     * Applies an impulse to the physics object.
     *
     * @param impulse The impulse vector.
     * @param location The location of the impulse.
     *
     * This method is useful for applying an impulse to a physics object, which can be used to simulate physical forces such as gravity,
     * collisions, and explosions. This can be used to create realistic physics simulations in a game or other application.
     */
    public applyImpulse(impulse: Vector3, location: Vector3): void {
        this._physicsPlugin.applyImpulse(this, impulse, location);
    }

    /**
     * Applies a force to the physics object.
     *
     * @param force The force vector.
     * @param location The location of the force.
     *
     * This method is useful for applying a force to a physics object, which can be used to simulate physical forces such as gravity,
     * collisions, and explosions. This can be used to create realistic physics simulations in a game or other application.
     */
    public applyForce(force: Vector3, location: Vector3): void {
        this._physicsPlugin.applyForce(this, force, location);
    }

    /**
     * Retrieves the geometry of the body from the physics plugin.
     *
     * @returns The geometry of the body.
     *
     * This method is useful for retrieving the geometry of the body from the physics plugin, which can be used for various physics calculations.
     */
    public getGeometry(): {} {
        return this._physicsPlugin.getBodyGeometry(this);
    }

    /**
     * Returns an observable that will be notified for all collisions happening for event-enabled bodies
     * @returns Observable
     */
    public getCollisionObservable(): Observable<IPhysicsCollisionEvent> {
        return this._physicsPlugin.getCollisionObservable(this);
    }

    /**
     * Enable or disable collision callback for this PhysicsBody.
     * @param enabled true if PhysicsBody's collision will rise a collision event and notifies the observable
     */
    public setCollisionCallbackEnabled(enabled: boolean): void {
        return this._physicsPlugin.setCollisionCallbackEnabled(this, enabled);
    }

    /**
     * Gets the object extents
     * @returns the object extents
     */
    public getObjectExtents(): Vector3 {
        const tmAbstractMesh = this.transformNode as AbstractMesh;
        if (tmAbstractMesh.getBoundingInfo) {
            const q = this.transformNode.rotationQuaternion;
            const scaling = this.transformNode.scaling.clone();
            //reset rotation
            this.transformNode.rotationQuaternion = PhysicsBody._IDENTITY_QUATERNION;
            //calculate the world matrix with no rotation
            const worldMatrix = this.transformNode.computeWorldMatrix && this.transformNode.computeWorldMatrix(true);
            if (worldMatrix) {
                worldMatrix.decompose(scaling, undefined, undefined);
            }
            tmAbstractMesh.refreshBoundingInfo();
            const boundingInfo = tmAbstractMesh.getBoundingInfo();
            // get the global scaling of the object
            const size = boundingInfo.boundingBox.extendSize.scale(2).multiplyInPlace(scaling);
            size.x = Math.abs(size.x);
            size.y = Math.abs(size.y);
            size.z = Math.abs(size.z);
            //bring back the rotation
            this.transformNode.rotationQuaternion = q;
            //calculate the world matrix with the new rotation
            this.transformNode.computeWorldMatrix && this.transformNode.computeWorldMatrix(true);
            return size;
        } else {
            return PhysicsBody._DEFAULT_OBJECT_SIZE;
        }
    }

    /**
     * returns the delta between the object bounding box center and the mesh origin
     * @returns delta between object bounding box center and origin
     */
    public getObjectCenterDelta(): Vector3 {
        const tmAbstractMesh = this.transformNode as AbstractMesh;
        if (tmAbstractMesh.getBoundingInfo) {
            const delta = new Vector3();
            const boundingInfo = tmAbstractMesh.getBoundingInfo();
            this.transformNode.computeWorldMatrix(true);
            tmAbstractMesh.refreshBoundingInfo();
            delta.copyFrom(boundingInfo.boundingBox.centerWorld);
            delta.subtractInPlace(tmAbstractMesh.getAbsolutePosition());
            delta.x /= tmAbstractMesh.scaling.x;
            delta.y /= tmAbstractMesh.scaling.y;
            delta.z /= tmAbstractMesh.scaling.z;
            return delta;
        } else {
            return Vector3.Zero();
        }
    }

    /**
     * @returns geometric center of the associated mesh
     */
    public getObjectCenter(): Vector3 {
        if ((<any>this.transformNode).getBoundingInfo) {
            const boundingInfo = (<any>this.transformNode).getBoundingInfo();
            return boundingInfo.boundingBox.centerWorld;
        } else {
            return this.transformNode.position;
        }
    }

    /**
     * Adds a constraint to the physics engine.
     *
     * @param childBody - The body to which the constraint will be applied.
     * @param constraint - The constraint to be applied.
     *
     */
    public addConstraint(childBody: PhysicsBody, constraint: PhysicsConstraint): void {
        this._physicsPlugin.addConstraint(this, childBody, constraint);
    }

    /**
     * Sync with a bone
     * @param bone The bone that the impostor will be synced to.
     * @param boneMesh The mesh that the bone is influencing.
     * @param jointPivot The pivot of the joint / bone in local space.
     * @param distToJoint Optional distance from the impostor to the joint.
     * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
     * @param boneAxis Optional vector3 axis the bone is aligned with
     */
    public syncWithBone(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion, boneAxis?: Vector3) {
        const mesh = this.transformNode;

        if (mesh.rotationQuaternion) {
            if (adjustRotation) {
                const tempQuat = TmpVectors.Quaternion[0];
                bone.getRotationQuaternionToRef(Space.WORLD, boneMesh, tempQuat);
                tempQuat.multiplyToRef(adjustRotation, mesh.rotationQuaternion);
            } else {
                bone.getRotationQuaternionToRef(Space.WORLD, boneMesh, mesh.rotationQuaternion);
            }
        }

        const pos = TmpVectors.Vector3[0];
        const boneDir = TmpVectors.Vector3[1];

        if (!boneAxis) {
            boneAxis = TmpVectors.Vector3[2];
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

    /**
     * Disposes the body from the physics engine.
     *
     * This method is useful for cleaning up the physics engine when a body is no longer needed. Disposing the body will free up resources and prevent memory leaks.
     */
    public dispose() {
        if (this._nodeDisposeObserver) {
            this.transformNode.onDisposeObservable.remove(this._nodeDisposeObserver);
            this._nodeDisposeObserver = null;
        }
        this._physicsEngine.removeBody(this);
        this._physicsPlugin.removeBody(this);
        this._physicsPlugin.disposeBody(this);
        this._pluginData = null;
        this._pluginDataInstances.length = 0;
    }
}
