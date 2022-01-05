import { Vector3 } from "../Maths/math.vector";
import { IPhysicsEnginePlugin } from "./IPhysicsEngine";
/**
 * Interface for Physics-Joint data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsJointData {
    //Important for some engines, optional!
    /**
     * The main pivot of the joint
     */
    mainPivot?: Vector3;
    /**
     * The connected pivot of the joint
     */
    connectedPivot?: Vector3;
    /**
     * The main axis of the joint
     */
    mainAxis?: Vector3;
    /**
     * The connected axis of the joint
     */
    connectedAxis?: Vector3;
    /**
     * The collision of the joint
     */
    collision?: boolean;
    /**
     * Native Oimo/Cannon/Energy data
     */
    nativeParams?: any;
}

/**
 * This is a holder class for the physics joint created by the physics plugin
 * It holds a set of functions to control the underlying joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class PhysicsJoint {

    private _physicsJoint: any;
    protected _physicsPlugin: IPhysicsEnginePlugin;

    /**
     * Initializes the physics joint
     * @param type The type of the physics joint
     * @param jointData The data for the physics joint
     */
    constructor(
        /**
         * The type of the physics joint
         */
        public type: number,
        /**
         * The data for the physics joint
         */
        public jointData: PhysicsJointData) {
        jointData.nativeParams = jointData.nativeParams || {};
    }

    /**
     * Gets the physics joint
     */
    public get physicsJoint(): any {
        return this._physicsJoint;
    }

    /**
     * Sets the physics joint
     */
    public set physicsJoint(newJoint: any) {

        if (this._physicsJoint) {
            //remove from the world
        }

        this._physicsJoint = newJoint;
    }

    /**
     * Sets the physics plugin
     */
    public set physicsPlugin(physicsPlugin: IPhysicsEnginePlugin) {
        this._physicsPlugin = physicsPlugin;
    }

    /**
     * Execute a function that is physics-plugin specific.
     * @param {Function} func the function that will be executed.
     *                        It accepts two parameters: the physics world and the physics joint
     */
    public executeNativeFunction(func: (world: any, physicsJoint: any) => void) {
        func(this._physicsPlugin.world, this._physicsJoint);
    }

    //TODO check if the native joints are the same

    //Joint Types
    /**
     * Distance-Joint type
     */
    public static DistanceJoint = 0;
    /**
     * Hinge-Joint type
     */
    public static HingeJoint = 1;
    /**
     * Ball-and-Socket joint type
     */
    public static BallAndSocketJoint = 2;
    /**
     * Wheel-Joint type
     */
    public static WheelJoint = 3;
    /**
     * Slider-Joint type
     */
    public static SliderJoint = 4;
    //OIMO
    /**
     * Prismatic-Joint type
     */
    public static PrismaticJoint = 5;
    //
    /**
     * Universal-Joint type
     * ENERGY FTW! (compare with this - @see http://ode-wiki.org/wiki/index.php?title=Manual:_Joint_Types_and_Functions)
     */
    public static UniversalJoint = 6;
    /**
     * Hinge-Joint 2 type
     */
    public static Hinge2Joint = PhysicsJoint.WheelJoint;
    //Cannon
    /**
     * Point to Point Joint type.  Similar to a Ball-Joint.  Different in parameters
     */
    public static PointToPointJoint = 8;
    //Cannon only at the moment
    /**
     * Spring-Joint type
     */
    public static SpringJoint = 9;
    /**
     * Lock-Joint type
     */
    public static LockJoint = 10;
}

/**
 * A class representing a physics distance joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class DistanceJoint extends PhysicsJoint {
    /**
     *
     * @param jointData The data for the Distance-Joint
     */
    constructor(jointData: DistanceJointData) {
        super(PhysicsJoint.DistanceJoint, jointData);
    }

    /**
     * Update the predefined distance.
     * @param maxDistance The maximum preferred distance
     * @param minDistance The minimum preferred distance
     */
    public updateDistance(maxDistance: number, minDistance?: number) {
        this._physicsPlugin.updateDistanceJoint(this, maxDistance, minDistance);
    }
}

/**
 * Represents a Motor-Enabled Joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class MotorEnabledJoint extends PhysicsJoint implements IMotorEnabledJoint {

    /**
     * Initializes the Motor-Enabled Joint
     * @param type The type of the joint
     * @param jointData The physical joint data for the joint
     */
    constructor(type: number, jointData: PhysicsJointData) {
        super(type, jointData);
    }

    /**
     * Set the motor values.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param force the force to apply
     * @param maxForce max force for this motor.
     */
    public setMotor(force?: number, maxForce?: number) {
        this._physicsPlugin.setMotor(this, force || 0, maxForce);
    }

    /**
     * Set the motor's limits.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param upperLimit The upper limit of the motor
     * @param lowerLimit The lower limit of the motor
     */
    public setLimit(upperLimit: number, lowerLimit?: number) {
        this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
    }
}

/**
 * This class represents a single physics Hinge-Joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class HingeJoint extends MotorEnabledJoint {

    /**
     * Initializes the Hinge-Joint
     * @param jointData The joint data for the Hinge-Joint
     */
    constructor(jointData: PhysicsJointData) {
        super(PhysicsJoint.HingeJoint, jointData);
    }

    /**
     * Set the motor values.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param {number} force the force to apply
     * @param {number} maxForce max force for this motor.
     */
    public setMotor(force?: number, maxForce?: number) {
        this._physicsPlugin.setMotor(this, force || 0, maxForce);
    }

    /**
     * Set the motor's limits.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param upperLimit The upper limit of the motor
     * @param lowerLimit The lower limit of the motor
     */
    public setLimit(upperLimit: number, lowerLimit?: number) {
        this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
    }
}

/**
 * This class represents a dual hinge physics joint (same as wheel joint)
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class Hinge2Joint extends MotorEnabledJoint {

    /**
     * Initializes the Hinge2-Joint
     * @param jointData The joint data for the Hinge2-Joint
     */
    constructor(jointData: PhysicsJointData) {
        super(PhysicsJoint.Hinge2Joint, jointData);
    }

    /**
    * Set the motor values.
    * Attention, this function is plugin specific. Engines won't react 100% the same.
    * @param {number} targetSpeed the speed the motor is to reach
    * @param {number} maxForce max force for this motor.
    * @param {motorIndex} the motor's index, 0 or 1.
    */
    public setMotor(targetSpeed?: number, maxForce?: number, motorIndex: number = 0) {
        this._physicsPlugin.setMotor(this, targetSpeed || 0, maxForce, motorIndex);
    }

    /**
     * Set the motor limits.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param {number} upperLimit the upper limit
     * @param {number} lowerLimit lower limit
     * @param {motorIndex} the motor's index, 0 or 1.
     */
    public setLimit(upperLimit: number, lowerLimit?: number, motorIndex: number = 0) {
        this._physicsPlugin.setLimit(this, upperLimit, lowerLimit, motorIndex);
    }
}

/**
 * Interface for a motor enabled joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface IMotorEnabledJoint {
    /**
     * Physics joint
     */
    physicsJoint: any;
    /**
     * Sets the motor of the motor-enabled joint
     * @param force The force of the motor
     * @param maxForce The maximum force of the motor
     * @param motorIndex The index of the motor
     */
    setMotor(force?: number, maxForce?: number, motorIndex?: number): void;
    /**
     * Sets the limit of the motor
     * @param upperLimit The upper limit of the motor
     * @param lowerLimit The lower limit of the motor
     * @param motorIndex The index of the motor
     */
    setLimit(upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
}

/**
 * Joint data for a Distance-Joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface DistanceJointData extends PhysicsJointData {
    /**
     * Max distance the 2 joint objects can be apart
     */
    maxDistance: number;
    //Oimo - minDistance
    //Cannon - maxForce
}

/**
 * Joint data from a spring joint
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface SpringJointData extends PhysicsJointData {
    /**
     * Length of the spring
     */
    length: number;
    /**
     * Stiffness of the spring
     */
    stiffness: number;
    /**
     * Damping of the spring
     */
    damping: number;
    /** this callback will be called when applying the force to the impostors. */
    forceApplicationCallback: () => void;
}
