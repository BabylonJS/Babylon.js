import { Nullable, IndicesArray } from "../types";
import { Logger } from "../Misc/logger";
import { ArrayTools } from "../Misc/arrayTools";
import { Vector3, Matrix, Quaternion } from "../Maths/math.vector";
import { TransformNode } from "../Meshes/transformNode";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import { Bone } from "../Bones/bone";
import { BoundingInfo } from "../Culling/boundingInfo";
import { IPhysicsEngine } from "./IPhysicsEngine";
import { PhysicsJoint, PhysicsJointData } from "./physicsJoint";
import { Space } from '../Maths/math.axis';

/**
 * The interface for the physics imposter parameters
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsImpostorParameters {
    /**
     * The mass of the physics imposter
     */
    mass: number;
    /**
     * The friction of the physics imposter
     */
    friction?: number;
    /**
     * The coefficient of restitution of the physics imposter
     */
    restitution?: number;
    /**
     * The native options of the physics imposter
     */
    nativeOptions?: any;
    /**
     * Specifies if the parent should be ignored
     */
    ignoreParent?: boolean;
    /**
     * Specifies if bi-directional transformations should be disabled
     */
    disableBidirectionalTransformation?: boolean;
    /**
     * The pressure inside the physics imposter, soft object only
     */
    pressure?: number;
    /**
     * The stiffness the physics imposter, soft object only
     */
    stiffness?: number;
    /**
     * The number of iterations used in maintaining consistent vertex velocities, soft object only
     */
    velocityIterations?: number;
    /**
     * The number of iterations used in maintaining consistent vertex positions, soft object only
     */
    positionIterations?: number;
    /**
     * The number used to fix points on a cloth (0, 1, 2, 4, 8) or rope (0, 1, 2) only
     * 0 None, 1, back left or top, 2, back right or bottom, 4, front left, 8, front right
     * Add to fix multiple points
     */
    fixedPoints?: number;
    /**
     * The collision margin around a soft object
     */
    margin?: number;
    /**
     * The collision margin around a soft object
     */
    damping?: number;
    /**
     * The path for a rope based on an extrusion
     */
    path?: any;
    /**
     * The shape of an extrusion used for a rope based on an extrusion
     */
    shape?: any;
}

/**
 * Interface for a physics-enabled object
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface IPhysicsEnabledObject {
    /**
     * The position of the physics-enabled object
     */
    position: Vector3;
    /**
     * The rotation of the physics-enabled object
     */
    rotationQuaternion: Nullable<Quaternion>;
    /**
     * The scale of the physics-enabled object
     */
    scaling: Vector3;
    /**
     * The rotation of the physics-enabled object
     */
    rotation?: Vector3;
    /**
     * The parent of the physics-enabled object
     */
    parent?: any;
    /**
     * The bounding info of the physics-enabled object
     * @returns The bounding info of the physics-enabled object
     */
    getBoundingInfo(): BoundingInfo;
    /**
     * Computes the world matrix
     * @param force Specifies if the world matrix should be computed by force
     * @returns A world matrix
     */
    computeWorldMatrix(force: boolean): Matrix;
    /**
     * Gets the world matrix
     * @returns A world matrix
     */
    getWorldMatrix?(): Matrix;
    /**
     * Gets the child meshes
     * @param directDescendantsOnly Specifies if only direct-descendants should be obtained
     * @returns An array of abstract meshes
     */
    getChildMeshes?(directDescendantsOnly?: boolean): Array<AbstractMesh>;
    /**
     * Gets the vertex data
     * @param kind The type of vertex data
     * @returns A nullable array of numbers, or a float32 array
     */
    getVerticesData(kind: string): Nullable<Array<number> | Float32Array>;
    /**
     * Gets the indices from the mesh
     * @returns A nullable array of index arrays
     */
    getIndices?(): Nullable<IndicesArray>;
    /**
     * Gets the scene from the mesh
     * @returns the indices array or null
     */
    getScene?(): Scene;
    /**
     * Gets the absolute position from the mesh
     * @returns the absolute position
     */
    getAbsolutePosition(): Vector3;
    /**
     * Gets the absolute pivot point from the mesh
     * @returns the absolute pivot point
     */
    getAbsolutePivotPoint(): Vector3;
    /**
     * Rotates the mesh
     * @param axis The axis of rotation
     * @param amount The amount of rotation
     * @param space The space of the rotation
     * @returns The rotation transform node
     */
    rotate(axis: Vector3, amount: number, space?: Space): TransformNode;
    /**
     * Translates the mesh
     * @param axis The axis of translation
     * @param distance The distance of translation
     * @param space The space of the translation
     * @returns The transform node
     */
    translate(axis: Vector3, distance: number, space?: Space): TransformNode;
    /**
     * Sets the absolute position of the mesh
     * @param absolutePosition The absolute position of the mesh
     * @returns The transform node
     */
    setAbsolutePosition(absolutePosition: Vector3): TransformNode;
    /**
     * Gets the class name of the mesh
     * @returns The class name
     */
    getClassName(): string;
}

Mesh._PhysicsImpostorParser = function(scene: Scene, physicObject: IPhysicsEnabledObject, jsonObject: any): PhysicsImpostor {
    return new PhysicsImpostor(physicObject, jsonObject.physicsImpostor, {
        mass: jsonObject.physicsMass,
        friction: jsonObject.physicsFriction,
        restitution: jsonObject.physicsRestitution
    }, scene);
};

/**
 * Represents a physics imposter
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class PhysicsImpostor {

    /**
     * The default object size of the imposter
     */
    public static DEFAULT_OBJECT_SIZE: Vector3 = new Vector3(1, 1, 1);

    /**
     * The identity quaternion of the imposter
     */
    public static IDENTITY_QUATERNION = Quaternion.Identity();

    /** @hidden */
    public _pluginData: any = {};

    private _physicsEngine: Nullable<IPhysicsEngine>;
    //The native cannon/oimo/energy physics body object.
    private _physicsBody: any;
    private _bodyUpdateRequired: boolean = false;

    private _onBeforePhysicsStepCallbacks = new Array<(impostor: PhysicsImpostor) => void>();
    private _onAfterPhysicsStepCallbacks = new Array<(impostor: PhysicsImpostor) => void>();
    /** @hidden */
    public _onPhysicsCollideCallbacks: Array<{ callback: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void, otherImpostors: Array<PhysicsImpostor> }> = [];

    private _deltaPosition: Vector3 = Vector3.Zero();
    private _deltaRotation: Quaternion;
    private _deltaRotationConjugated: Quaternion;

    /** @hidden */
    public _isFromLine: boolean;

    //If set, this is this impostor's parent
    private _parent: Nullable<PhysicsImpostor>;

    private _isDisposed = false;

    private static _tmpVecs: Vector3[] = ArrayTools.BuildArray(3, Vector3.Zero);
    private static _tmpQuat: Quaternion = Quaternion.Identity();

    /**
     * Specifies if the physics imposter is disposed
     */
    get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Gets the mass of the physics imposter
     */
    get mass(): number {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyMass(this) : 0;
    }

    set mass(value: number) {
        this.setMass(value);
    }

    /**
     * Gets the coefficient of friction
     */
    get friction(): number {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyFriction(this) : 0;
    }

    /**
     * Sets the coefficient of friction
     */
    set friction(value: number) {
        if (!this._physicsEngine) {
            return;
        }
        this._physicsEngine.getPhysicsPlugin().setBodyFriction(this, value);
    }

    /**
     * Gets the coefficient of restitution
     */
    get restitution(): number {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyRestitution(this) : 0;
    }

    /**
     * Sets the coefficient of restitution
     */
    set restitution(value: number) {
        if (!this._physicsEngine) {
            return;
        }
        this._physicsEngine.getPhysicsPlugin().setBodyRestitution(this, value);
    }

    /**
     * Gets the pressure of a soft body; only supported by the AmmoJSPlugin
     */
    get pressure(): number {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyPressure) {
            return 0;
        }
        return plugin.getBodyPressure!(this);
    }

    /**
     * Sets the pressure of a soft body; only supported by the AmmoJSPlugin
     */
    set pressure(value: number) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyPressure) {
            return;
        }
        plugin.setBodyPressure!(this, value);
    }

    /**
     * Gets the stiffness of a soft body; only supported by the AmmoJSPlugin
     */
    get stiffness(): number {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.getBodyStiffness) {
            return 0;
        }
        return plugin.getBodyStiffness!(this);
    }

    /**
     * Sets the stiffness of a soft body; only supported by the AmmoJSPlugin
     */
    set stiffness(value: number) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyStiffness) {
            return;
        }
        plugin.setBodyStiffness!(this, value);
    }

    /**
     * Gets the velocityIterations of a soft body; only supported by the AmmoJSPlugin
     */
    get velocityIterations(): number {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.getBodyVelocityIterations) {
            return 0;
        }
        return plugin.getBodyVelocityIterations!(this);
    }

    /**
     * Sets the velocityIterations of a soft body; only supported by the AmmoJSPlugin
     */
    set velocityIterations(value: number) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyVelocityIterations) {
            return;
        }
        plugin.setBodyVelocityIterations!(this, value);
    }

    /**
     * Gets the positionIterations of a soft body; only supported by the AmmoJSPlugin
     */
    get positionIterations(): number {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.getBodyPositionIterations) {
            return 0;
        }
        return plugin.getBodyPositionIterations!(this);
    }

    /**
     * Sets the positionIterations of a soft body; only supported by the AmmoJSPlugin
     */
    set positionIterations(value: number) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyPositionIterations) {
            return;
        }
        plugin.setBodyPositionIterations!(this, value);
    }

    /**
     * The unique id of the physics imposter
     * set by the physics engine when adding this impostor to the array
     */
    public uniqueId: number;

    /**
     * @hidden
     */
    public soft: boolean = false;

    /**
     * @hidden
     */
    public segments: number = 0;

    private _joints: Array<{
        joint: PhysicsJoint,
        otherImpostor: PhysicsImpostor
    }>;

    /**
     * Initializes the physics imposter
     * @param object The physics-enabled object used as the physics imposter
     * @param type The type of the physics imposter
     * @param _options The options for the physics imposter
     * @param _scene The Babylon scene
     */
    constructor(
        /**
         * The physics-enabled object used as the physics imposter
         */
        public object: IPhysicsEnabledObject,
        /**
         * The type of the physics imposter
         */
        public type: number, private _options: PhysicsImpostorParameters = { mass: 0 }, private _scene?: Scene) {

        //sanity check!
        if (!this.object) {
            Logger.Error("No object was provided. A physics object is obligatory");
            return;
        }
        if (this.object.parent && _options.mass !== 0) {
            Logger.Warn("A physics impostor has been created for an object which has a parent. Babylon physics currently works in local space so unexpected issues may occur.");
        }

        // Legacy support for old syntax.
        if (!this._scene && object.getScene) {
            this._scene = object.getScene();
        }

        if (!this._scene) {
            return;
        }

        if (this.type > 100) {
            this.soft = true;
        }

        this._physicsEngine = this._scene.getPhysicsEngine();
        if (!this._physicsEngine) {
            Logger.Error("Physics not enabled. Please use scene.enablePhysics(...) before creating impostors.");
        } else {
            //set the object's quaternion, if not set
            if (!this.object.rotationQuaternion) {
                if (this.object.rotation) {
                    this.object.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.object.rotation.y, this.object.rotation.x, this.object.rotation.z);
                } else {
                    this.object.rotationQuaternion = new Quaternion();
                }

            }
            //default options params
            this._options.mass = (_options.mass === void 0) ? 0 : _options.mass;
            this._options.friction = (_options.friction === void 0) ? 0.2 : _options.friction;
            this._options.restitution = (_options.restitution === void 0) ? 0.2 : _options.restitution;
            if (this.soft) {
                //softbody mass must be above 0;
                this._options.mass = this._options.mass > 0 ? this._options.mass : 1;
                this._options.pressure = (_options.pressure === void 0) ? 200 : _options.pressure;
                this._options.stiffness = (_options.stiffness === void 0) ? 1 : _options.stiffness;
                this._options.velocityIterations = (_options.velocityIterations === void 0) ? 20 : _options.velocityIterations;
                this._options.positionIterations = (_options.positionIterations === void 0) ? 20 : _options.positionIterations;
                this._options.fixedPoints = (_options.fixedPoints === void 0) ? 0 : _options.fixedPoints;
                this._options.margin = (_options.margin === void 0) ? 0 : _options.margin;
                this._options.damping = (_options.damping === void 0) ? 0 : _options.damping;
                this._options.path = (_options.path === void 0) ? null : _options.path;
                this._options.shape = (_options.shape === void 0) ? null : _options.shape;
            }
            this._joints = [];
            //If the mesh has a parent, don't initialize the physicsBody. Instead wait for the parent to do that.
            if (!this.object.parent || this._options.ignoreParent) {
                this._init();
            } else if (this.object.parent.physicsImpostor) {
                Logger.Warn("You must affect impostors to children before affecting impostor to parent.");
            }
        }
    }

    /**
     * This function will completly initialize this impostor.
     * It will create a new body - but only if this mesh has no parent.
     * If it has, this impostor will not be used other than to define the impostor
     * of the child mesh.
     * @hidden
     */
    public _init() {
        if (!this._physicsEngine) {
            return;
        }

        this._physicsEngine.removeImpostor(this);
        this.physicsBody = null;
        this._parent = this._parent || this._getPhysicsParent();
        if (!this._isDisposed && (!this.parent || this._options.ignoreParent)) {
            this._physicsEngine.addImpostor(this);
        }
    }

    private _getPhysicsParent(): Nullable<PhysicsImpostor> {
        if (this.object.parent instanceof AbstractMesh) {
            var parentMesh: AbstractMesh = <AbstractMesh>this.object.parent;
            return parentMesh.physicsImpostor;
        }
        return null;
    }

    /**
     * Should a new body be generated.
     * @returns boolean specifying if body initialization is required
     */
    public isBodyInitRequired(): boolean {
        return this._bodyUpdateRequired || (!this._physicsBody && !this._parent);
    }

    /**
     * Sets the updated scaling
     * @param updated Specifies if the scaling is updated
     */
    public setScalingUpdated() {
        this.forceUpdate();
    }

    /**
     * Force a regeneration of this or the parent's impostor's body.
     * Use under cautious - This will remove all joints already implemented.
     */
    public forceUpdate() {
        this._init();
        if (this.parent && !this._options.ignoreParent) {
            this.parent.forceUpdate();
        }
    }

    /*public get mesh(): AbstractMesh {
        return this._mesh;
    }*/

    /**
     * Gets the body that holds this impostor. Either its own, or its parent.
     */
    public get physicsBody(): any {
        return (this._parent && !this._options.ignoreParent) ? this._parent.physicsBody : this._physicsBody;
    }

    /**
     * Get the parent of the physics imposter
     * @returns Physics imposter or null
     */
    public get parent(): Nullable<PhysicsImpostor> {
        return !this._options.ignoreParent && this._parent ? this._parent : null;
    }

    /**
     * Sets the parent of the physics imposter
     */
    public set parent(value: Nullable<PhysicsImpostor>) {
        this._parent = value;
    }

    /**
     * Set the physics body. Used mainly by the physics engine/plugin
     */
    public set physicsBody(physicsBody: any) {
        if (this._physicsBody && this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().removePhysicsBody(this);
        }
        this._physicsBody = physicsBody;
        this.resetUpdateFlags();
    }

    /**
     * Resets the update flags
     */
    public resetUpdateFlags() {
        this._bodyUpdateRequired = false;
    }

    /**
     * Gets the object extend size
     * @returns the object extend size
     */
    public getObjectExtendSize(): Vector3 {
        if (this.object.getBoundingInfo) {
            let q = this.object.rotationQuaternion;
            //reset rotation
            this.object.rotationQuaternion = PhysicsImpostor.IDENTITY_QUATERNION;
            //calculate the world matrix with no rotation
            this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
            let boundingInfo = this.object.getBoundingInfo();
            let size = boundingInfo.boundingBox.extendSizeWorld.scale(2);

            //bring back the rotation
            this.object.rotationQuaternion = q;
            //calculate the world matrix with the new rotation
            this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
            return size;
        } else {
            return PhysicsImpostor.DEFAULT_OBJECT_SIZE;
        }
    }

    /**
     * Gets the object center
     * @returns The object center
     */
    public getObjectCenter(): Vector3 {
        if (this.object.getBoundingInfo) {
            let boundingInfo = this.object.getBoundingInfo();
            return boundingInfo.boundingBox.centerWorld;
        } else {
            return this.object.position;
        }
    }

    /**
     * Get a specific parameter from the options parameters
     * @param paramName The object parameter name
     * @returns The object parameter
     */
    public getParam(paramName: string): any {
        return (<any>this._options)[paramName];
    }

    /**
     * Sets a specific parameter in the options given to the physics plugin
     * @param paramName The parameter name
     * @param value The value of the parameter
     */
    public setParam(paramName: string, value: number) {
        (<any>this._options)[paramName] = value;
        this._bodyUpdateRequired = true;
    }

    /**
     * Specifically change the body's mass option. Won't recreate the physics body object
     * @param mass The mass of the physics imposter
     */
    public setMass(mass: number) {
        if (this.getParam("mass") !== mass) {
            this.setParam("mass", mass);
        }
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().setBodyMass(this, mass);
        }
    }

    /**
     * Gets the linear velocity
     * @returns  linear velocity or null
     */
    public getLinearVelocity(): Nullable<Vector3> {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this) : Vector3.Zero();
    }

    /**
     * Sets the linear velocity
     * @param velocity  linear velocity or null
     */
    public setLinearVelocity(velocity: Nullable<Vector3>) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
        }
    }

    /**
     * Gets the angular velocity
     * @returns angular velocity or null
     */
    public getAngularVelocity(): Nullable<Vector3> {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this) : Vector3.Zero();
    }

    /**
     * Sets the angular velocity
     * @param velocity The velocity or null
     */
    public setAngularVelocity(velocity: Nullable<Vector3>) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, velocity);
        }
    }

    /**
     * Execute a function with the physics plugin native code
     * Provide a function the will have two variables - the world object and the physics body object
     * @param func The function to execute with the physics plugin native code
     */

    public executeNativeFunction(func: (world: any, physicsBody: any) => void) {
        if (this._physicsEngine) {
            func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
        }
    }

    /**
     * Register a function that will be executed before the physics world is stepping forward
     * @param func The function to execute before the physics world is stepped forward
     */
    public registerBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
        this._onBeforePhysicsStepCallbacks.push(func);
    }

    /**
     * Unregister a function that will be executed before the physics world is stepping forward
     * @param func The function to execute before the physics world is stepped forward
     */
    public unregisterBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
        var index = this._onBeforePhysicsStepCallbacks.indexOf(func);

        if (index > -1) {
            this._onBeforePhysicsStepCallbacks.splice(index, 1);
        } else {
            Logger.Warn("Function to remove was not found");
        }
    }

    /**
     * Register a function that will be executed after the physics step
     * @param func The function to execute after physics step
     */
    public registerAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
        this._onAfterPhysicsStepCallbacks.push(func);
    }

    /**
     * Unregisters a function that will be executed after the physics step
     * @param func The function to execute after physics step
     */
    public unregisterAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void {
        var index = this._onAfterPhysicsStepCallbacks.indexOf(func);

        if (index > -1) {
            this._onAfterPhysicsStepCallbacks.splice(index, 1);
        } else {
            Logger.Warn("Function to remove was not found");
        }
    }

    /**
     * register a function that will be executed when this impostor collides against a different body
     * @param collideAgainst Physics imposter, or array of physics imposters to collide against
     * @param func Callback that is executed on collision
     */
    public registerOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void): void {
        var collidedAgainstList: Array<PhysicsImpostor> = collideAgainst instanceof Array ? <Array<PhysicsImpostor>>collideAgainst : [<PhysicsImpostor>collideAgainst];
        this._onPhysicsCollideCallbacks.push({ callback: func, otherImpostors: collidedAgainstList });
    }

    /**
     * Unregisters the physics imposter on contact
     * @param collideAgainst The physics object to collide against
     * @param func Callback to execute on collision
     */
    public unregisterOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor | Array<PhysicsImpostor>) => void): void {
        var collidedAgainstList: Array<PhysicsImpostor> = collideAgainst instanceof Array ? <Array<PhysicsImpostor>>collideAgainst : [<PhysicsImpostor>collideAgainst];
        var index = -1;
        let found = this._onPhysicsCollideCallbacks.some((cbDef, idx) => {
            if (cbDef.callback === func && cbDef.otherImpostors.length === collidedAgainstList.length) {
                // chcek the arrays match
                let sameList = cbDef.otherImpostors.every((impostor) => {
                    return collidedAgainstList.indexOf(impostor) > -1;
                });
                if (sameList) {
                    index = idx;
                }
                return sameList;
            }
            return false;
        });

        if (found) {
            this._onPhysicsCollideCallbacks.splice(index, 1);
        } else {
            Logger.Warn("Function to remove was not found");
        }
    }

    //temp variables for parent rotation calculations
    //private _mats: Array<Matrix> = [new Matrix(), new Matrix()];
    private _tmpQuat: Quaternion = new Quaternion();
    private _tmpQuat2: Quaternion = new Quaternion();

    /**
     * Get the parent rotation
     * @returns The parent rotation
     */
    public getParentsRotation(): Quaternion {
        let parent = this.object.parent;
        this._tmpQuat.copyFromFloats(0, 0, 0, 1);
        while (parent) {
            if (parent.rotationQuaternion) {
                this._tmpQuat2.copyFrom(parent.rotationQuaternion);
            } else {
                Quaternion.RotationYawPitchRollToRef(parent.rotation.y, parent.rotation.x, parent.rotation.z, this._tmpQuat2);
            }
            this._tmpQuat.multiplyToRef(this._tmpQuat2, this._tmpQuat);
            parent = parent.parent;
        }
        return this._tmpQuat;
    }

    /**
     * this function is executed by the physics engine.
     */
    public beforeStep = () => {
        if (!this._physicsEngine) {
            return;
        }

        this.object.translate(this._deltaPosition, -1);
        this._deltaRotationConjugated && this.object.rotationQuaternion && this.object.rotationQuaternion.multiplyToRef(this._deltaRotationConjugated, this.object.rotationQuaternion);
        this.object.computeWorldMatrix(false);
        if (this.object.parent && this.object.rotationQuaternion) {
            this.getParentsRotation();
            this._tmpQuat.multiplyToRef(this.object.rotationQuaternion, this._tmpQuat);
        } else {
            this._tmpQuat.copyFrom(this.object.rotationQuaternion || new Quaternion());
        }
        if (!this._options.disableBidirectionalTransformation) {
            this.object.rotationQuaternion && this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(this, /*bInfo.boundingBox.centerWorld*/ this.object.getAbsolutePosition(), this._tmpQuat);
        }

        this._onBeforePhysicsStepCallbacks.forEach((func) => {
            func(this);
        });
    }

    /**
     * this function is executed by the physics engine
     */
    public afterStep = () => {
        if (!this._physicsEngine) {
            return;
        }

        this._onAfterPhysicsStepCallbacks.forEach((func) => {
            func(this);
        });

        this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(this);
        // object has now its world rotation. needs to be converted to local.
        if (this.object.parent && this.object.rotationQuaternion) {
            this.getParentsRotation();
            this._tmpQuat.conjugateInPlace();
            this._tmpQuat.multiplyToRef(this.object.rotationQuaternion, this.object.rotationQuaternion);
        }
        // take the position set and make it the absolute position of this object.
        this.object.setAbsolutePosition(this.object.position);
        this._deltaRotation && this.object.rotationQuaternion && this.object.rotationQuaternion.multiplyToRef(this._deltaRotation, this.object.rotationQuaternion);
        this.object.translate(this._deltaPosition, 1);
    }

    /**
     * Legacy collision detection event support
     */
    public onCollideEvent: Nullable<(collider: PhysicsImpostor, collidedWith: PhysicsImpostor) => void> = null;

    /**
     * event and body object due to cannon's event-based architecture.
     */
    public onCollide = (e: { body: any }) => {
        if (!this._onPhysicsCollideCallbacks.length && !this.onCollideEvent) {
            return;
        }

        if (!this._physicsEngine) {
            return;

        }
        var otherImpostor = this._physicsEngine.getImpostorWithPhysicsBody(e.body);
        if (otherImpostor) {
            // Legacy collision detection event support
            if (this.onCollideEvent) {
                this.onCollideEvent(this, otherImpostor);
            }
            this._onPhysicsCollideCallbacks.filter((obj) => {
                return obj.otherImpostors.indexOf((<PhysicsImpostor>otherImpostor)) !== -1;
            }).forEach((obj) => {
                obj.callback(this, <PhysicsImpostor>otherImpostor);
            });
        }
    }

    /**
     * Apply a force
     * @param force The force to apply
     * @param contactPoint The contact point for the force
     * @returns The physics imposter
     */
    public applyForce(force: Vector3, contactPoint: Vector3): PhysicsImpostor {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
        }
        return this;
    }

    /**
     * Apply an impulse
     * @param force The impulse force
     * @param contactPoint The contact point for the impulse force
     * @returns The physics imposter
     */
    public applyImpulse(force: Vector3, contactPoint: Vector3): PhysicsImpostor {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
        }

        return this;
    }

    /**
     * A help function to create a joint
     * @param otherImpostor A physics imposter used to create a joint
     * @param jointType The type of joint
     * @param jointData The data for the joint
     * @returns The physics imposter
     */
    public createJoint(otherImpostor: PhysicsImpostor, jointType: number, jointData: PhysicsJointData): PhysicsImpostor {
        var joint = new PhysicsJoint(jointType, jointData);
        this.addJoint(otherImpostor, joint);

        return this;
    }

    /**
     * Add a joint to this impostor with a different impostor
     * @param otherImpostor A physics imposter used to add a joint
     * @param joint The joint to add
     * @returns The physics imposter
     */
    public addJoint(otherImpostor: PhysicsImpostor, joint: PhysicsJoint): PhysicsImpostor {
        this._joints.push({
            otherImpostor: otherImpostor,
            joint: joint
        });

        if (this._physicsEngine) {
            this._physicsEngine.addJoint(this, otherImpostor, joint);
        }

        return this;
    }

    /**
     * Add an anchor to a cloth impostor
     * @param otherImpostor rigid impostor to anchor to
     * @param width ratio across width from 0 to 1
     * @param height ratio up height from 0 to 1
     * @param influence the elasticity between cloth impostor and anchor from 0, very stretchy to 1, little strech
     * @param noCollisionBetweenLinkedBodies when true collisions between cloth impostor and anchor are ignored; default false
     * @returns impostor the soft imposter
     */
    public addAnchor(otherImpostor: PhysicsImpostor, width: number, height: number, influence: number, noCollisionBetweenLinkedBodies: boolean): PhysicsImpostor {
        if (!this._physicsEngine) {
            return this;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.appendAnchor) {
            return this;
        }
        if (this._physicsEngine) {
            plugin.appendAnchor!(this, otherImpostor, width, height, influence, noCollisionBetweenLinkedBodies);
        }
        return this;
    }

    /**
     * Add a hook to a rope impostor
     * @param otherImpostor rigid impostor to anchor to
     * @param length ratio across rope from 0 to 1
     * @param influence the elasticity between rope impostor and anchor from 0, very stretchy to 1, little strech
     * @param noCollisionBetweenLinkedBodies when true collisions between soft impostor and anchor are ignored; default false
     * @returns impostor the rope imposter
     */
    public addHook(otherImpostor: PhysicsImpostor, length: number, influence: number, noCollisionBetweenLinkedBodies: boolean): PhysicsImpostor {
        if (!this._physicsEngine) {
            return this;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.appendAnchor) {
            return this;
        }
        if (this._physicsEngine) {
            plugin.appendHook!(this, otherImpostor, length, influence, noCollisionBetweenLinkedBodies);
        }
        return this;
    }

    /**
     * Will keep this body still, in a sleep mode.
     * @returns the physics imposter
     */
    public sleep(): PhysicsImpostor {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().sleepBody(this);
        }

        return this;
    }

    /**
     * Wake the body up.
     * @returns The physics imposter
     */
    public wakeUp(): PhysicsImpostor {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().wakeUpBody(this);
        }

        return this;
    }

    /**
     * Clones the physics imposter
     * @param newObject The physics imposter clones to this physics-enabled object
     * @returns A nullable physics imposter
     */
    public clone(newObject: IPhysicsEnabledObject): Nullable<PhysicsImpostor> {
        if (!newObject) { return null; }
        return new PhysicsImpostor(newObject, this.type, this._options, this._scene);
    }

    /**
     * Disposes the physics imposter
     */
    public dispose(/*disposeChildren: boolean = true*/) {
        //no dispose if no physics engine is available.
        if (!this._physicsEngine) {
            return;
        }

        this._joints.forEach((j) => {
            if (this._physicsEngine) {
                this._physicsEngine.removeJoint(this, j.otherImpostor, j.joint);
            }
        });
        //dispose the physics body
        this._physicsEngine.removeImpostor(this);
        if (this.parent) {
            this.parent.forceUpdate();
        } else {
            /*this._object.getChildMeshes().forEach(function(mesh) {
                if (mesh.physicsImpostor) {
                    if (disposeChildren) {
                        mesh.physicsImpostor.dispose();
                        mesh.physicsImpostor = null;
                    }
                }
            })*/
        }

        this._isDisposed = true;
    }

    /**
     * Sets the delta position
     * @param position The delta position amount
     */
    public setDeltaPosition(position: Vector3) {
        this._deltaPosition.copyFrom(position);
    }

    /**
     * Sets the delta rotation
     * @param rotation The delta rotation amount
     */
    public setDeltaRotation(rotation: Quaternion) {
        if (!this._deltaRotation) {
            this._deltaRotation = new Quaternion();
        }
        this._deltaRotation.copyFrom(rotation);
        this._deltaRotationConjugated = this._deltaRotation.conjugate();
    }

    /**
     * Gets the box size of the physics imposter and stores the result in the input parameter
     * @param result Stores the box size
     * @returns The physics imposter
     */
    public getBoxSizeToRef(result: Vector3): PhysicsImpostor {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().getBoxSizeToRef(this, result);
        }

        return this;
    }

    /**
     * Gets the radius of the physics imposter
     * @returns Radius of the physics imposter
     */
    public getRadius(): number {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getRadius(this) : 0;
    }

    /**
     * Sync a bone with this impostor
     * @param bone The bone to sync to the impostor.
     * @param boneMesh The mesh that the bone is influencing.
     * @param jointPivot The pivot of the joint / bone in local space.
     * @param distToJoint Optional distance from the impostor to the joint.
     * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
     */
    public syncBoneWithImpostor(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion) {

        var tempVec = PhysicsImpostor._tmpVecs[0];
        var mesh = <AbstractMesh>this.object;

        if (mesh.rotationQuaternion) {
            if (adjustRotation) {
                var tempQuat = PhysicsImpostor._tmpQuat;
                mesh.rotationQuaternion.multiplyToRef(adjustRotation, tempQuat);
                bone.setRotationQuaternion(tempQuat, Space.WORLD, boneMesh);
            } else {
                bone.setRotationQuaternion(mesh.rotationQuaternion, Space.WORLD, boneMesh);
            }
        }

        tempVec.x = 0;
        tempVec.y = 0;
        tempVec.z = 0;

        if (jointPivot) {
            tempVec.x = jointPivot.x;
            tempVec.y = jointPivot.y;
            tempVec.z = jointPivot.z;

            bone.getDirectionToRef(tempVec, boneMesh, tempVec);

            if (distToJoint === undefined || distToJoint === null) {
                distToJoint = jointPivot.length();
            }

            tempVec.x *= distToJoint;
            tempVec.y *= distToJoint;
            tempVec.z *= distToJoint;
        }

        if (bone.getParent()) {
            tempVec.addInPlace(mesh.getAbsolutePosition());
            bone.setAbsolutePosition(tempVec, boneMesh);
        } else {
            boneMesh.setAbsolutePosition(mesh.getAbsolutePosition());
            boneMesh.position.x -= tempVec.x;
            boneMesh.position.y -= tempVec.y;
            boneMesh.position.z -= tempVec.z;
        }

    }

    /**
     * Sync impostor to a bone
     * @param bone The bone that the impostor will be synced to.
     * @param boneMesh The mesh that the bone is influencing.
     * @param jointPivot The pivot of the joint / bone in local space.
     * @param distToJoint Optional distance from the impostor to the joint.
     * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
     * @param boneAxis Optional vector3 axis the bone is aligned with
     */
    public syncImpostorWithBone(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion, boneAxis?: Vector3) {

        var mesh = <AbstractMesh>this.object;

        if (mesh.rotationQuaternion) {
            if (adjustRotation) {
                var tempQuat = PhysicsImpostor._tmpQuat;
                bone.getRotationQuaternionToRef(Space.WORLD, boneMesh, tempQuat);
                tempQuat.multiplyToRef(adjustRotation, mesh.rotationQuaternion);
            } else {
                bone.getRotationQuaternionToRef(Space.WORLD, boneMesh, mesh.rotationQuaternion);
            }
        }

        var pos = PhysicsImpostor._tmpVecs[0];
        var boneDir = PhysicsImpostor._tmpVecs[1];

        if (!boneAxis) {
            boneAxis = PhysicsImpostor._tmpVecs[2];
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

    //Impostor types
    /**
     * No-Imposter type
     */
    public static NoImpostor = 0;
    /**
     * Sphere-Imposter type
     */
    public static SphereImpostor = 1;
    /**
     * Box-Imposter type
     */
    public static BoxImpostor = 2;
    /**
     * Plane-Imposter type
     */
    public static PlaneImpostor = 3;
    /**
     * Mesh-imposter type
     */
    public static MeshImpostor = 4;
    /**
     * Capsule-Impostor type (Ammo.js plugin only)
     */
    public static CapsuleImpostor = 6;
    /**
     * Cylinder-Imposter type
     */
    public static CylinderImpostor = 7;
    /**
     * Particle-Imposter type
     */
    public static ParticleImpostor = 8;
    /**
     * Heightmap-Imposter type
     */
    public static HeightmapImpostor = 9;
    /**
     * ConvexHull-Impostor type (Ammo.js plugin only)
     */
    public static ConvexHullImpostor = 10;
    /**
     * Custom-Imposter type (Ammo.js plugin only)
     */
    public static CustomImpostor = 100;
    /**
     * Rope-Imposter type
     */
    public static RopeImpostor = 101;
    /**
     * Cloth-Imposter type
     */
    public static ClothImpostor = 102;
    /**
     * Softbody-Imposter type
     */
    public static SoftbodyImpostor = 103;
}
