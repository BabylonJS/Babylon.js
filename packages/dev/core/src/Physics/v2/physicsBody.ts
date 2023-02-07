import type { IPhysicsEnginePluginV2, MassProperties } from "./IPhysicsEnginePlugin";
import type { PhysicsShape } from "./physicsShape";
import { Vector3, Quaternion } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import type { PhysicsEngine } from "./physicsEngine";
import type { Mesh, TransformNode, AbstractMesh } from "../../Meshes";
import type { Nullable } from "core/types";

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

    /**
     * Constructs a new physics body for the given node.
     * @param transformNode - The Transform Node to construct the physics body for.
     * @param scene - The scene containing the physics engine.
     *
     * This code is useful for creating a physics body for a given Transform Node in a scene.
     * It checks the version of the physics engine and the physics plugin, and initializes the body accordingly.
     * It also sets the node's rotation quaternion if it is not already set. Finally, it adds the body to the physics engine.
     */
    constructor(transformNode: TransformNode, scene: Scene) {
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
            this._physicsPlugin.initBodyInstances(this, m);
        } else {
            // single instance
            this._physicsPlugin.initBody(this, transformNode.position, transformNode.rotationQuaternion);
        }
        this.transformNode = transformNode;
        transformNode.physicsBody = this;
        physicsEngine.addBody(this);
    }

    /**
     * Sets the shape of the physics body.
     * @param shape - The shape of the physics body.
     *
     * This method is useful for setting the shape of the physics body, which is necessary for the physics engine to accurately simulate the body's behavior.
     * The shape is used to calculate the body's mass, inertia, and other properties.
     */
    public setShape(shape: PhysicsShape): void {
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
    public getShape(): PhysicsShape | undefined {
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
    public setFilterGroup(group: number): void {
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
    public getFilterGroup(): number {
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
    public setEventMask(eventMask: number): void {
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
    public getEventMask(): number {
        return this._physicsPlugin.getEventMask(this);
    }

    /**
     * Sets the mass properties of the physics object.
     *
     * @param massProps - The mass properties to set.
     *
     * This method is useful for setting the mass properties of a physics object, such as its mass,
     * inertia, and center of mass. This is important for accurately simulating the physics of the object in the physics engine.
     */
    public setMassProperties(massProps: MassProperties): void {
        this._physicsPlugin.setMassProperties(this, massProps);
    }

    /**
     * Retrieves the mass properties of the object.
     *
     * @returns The mass properties of the object, or `undefined` if the physics
     * plugin does not support mass properties.
     *
     * This method is useful for physics simulations, as it allows the user to
     * retrieve the mass properties of the object, such as its mass, center of mass,
     * and moment of inertia. This information is necessary for accurate physics
     * simulations.
     */
    public getMassProperties(): MassProperties | undefined {
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
    public setLinearDamping(damping: number): void {
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
    public getLinearDamping(): number {
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
    public setAngularDamping(damping: number): void {
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
    public getAngularDamping(): number {
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
     * @param location The location of the impulse.
     * @param impulse The impulse vector.
     *
     * This method is useful for applying an impulse to a physics object, which can be used to simulate physical forces such as gravity,
     * collisions, and explosions. This can be used to create realistic physics simulations in a game or other application.
     */
    public applyImpulse(location: Vector3, impulse: Vector3): void {
        this._physicsPlugin.applyImpulse(this, location, impulse);
    }

    /**
     * Applies a force to the physics object.
     *
     * @param location The location of the force.
     * @param force The force vector.
     *
     * This method is useful for applying a force to a physics object, which can be used to simulate physical forces such as gravity,
     * collisions, and explosions. This can be used to create realistic physics simulations in a game or other application.
     */
    public applyForce(location: Vector3, force: Vector3): void {
        this._physicsPlugin.applyForce(this, location, force);
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
     * Register a collision callback that is called when the body collides
     * Filtering by body is inefficient. It's more preferable to register a collision callback for the entire world
     * and do the filtering on the user side.
     */
    public registerOnCollide(func: (collider: PhysicsBody, collidedAgainst: PhysicsBody, point: Nullable<Vector3>) => void): void {
        return this._physicsPlugin.registerOnBodyCollide(this, func);
    }

    /**
     * Unregister a collision callback that is called when the body collides
     */
    public unregisterOnCollide(func: (collider: PhysicsBody, collidedAgainst: PhysicsBody, point: Nullable<Vector3>) => void): void {
        return this._physicsPlugin.unregisterOnBodyCollide(this, func);
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
     * return geometric center of the associated mesh
     */
    public getObjectCenter(): Vector3 {
        // TODO
        return new Vector3(0, 0, 0);
    }

    /**
     * Disposes the body from the physics engine.
     *
     * This method is useful for cleaning up the physics engine when a body is no longer needed. Disposing the body will free up resources and prevent memory leaks.
     */
    public dispose() {
        this._physicsEngine.removeBody(this);
        this._physicsPlugin.removeBody(this);
        this._physicsPlugin.disposeBody(this);
    }
}
