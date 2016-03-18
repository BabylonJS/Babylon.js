module BABYLON {

    export interface PhysicsJointData {
        //Important for some engines, optional!
        mainPivot?: Vector3;
        connectedPivot?: Vector3;
        mainAxis?: Vector3,
        connectedAxis?: Vector3,
        collision?: boolean
        //Native Oimo/Cannon/Energy data
        nativeParams?: any;
    }

    /**
     * This is a holder class for the physics joint created by the physics plugin.
     * It holds a set of functions to control the underlying joint.
     */
    export class PhysicsJoint {

        private _physicsJoint;
        protected _physicsPlugin: IPhysicsEnginePlugin;

        constructor(public type: number, public jointData: PhysicsJointData) {
            jointData.nativeParams = jointData.nativeParams || {};
        }

        public get physicsJoint() {
            return this._physicsJoint;
        }

        public set physicsJoint(newJoint: any) {

            if (this._physicsJoint) {
                //remove from the wolrd
            }

            this._physicsJoint = newJoint;
        }

        public set physicsPlugin(physicsPlugin: IPhysicsEnginePlugin) {
            this._physicsPlugin = physicsPlugin;
        }
        
        /**
         * Execute a function that is physics-plugin specific.
         * @param {Function} func the function that will be executed. 
         *                        It accepts two parameters: the physics world and the physics joint.
         */
        public executeNativeFunction(func : (world: any, physicsJoint:any) => void) {
            func(this._physicsPlugin.world, this._physicsJoint)
        }


        //TODO check if the native joints are the same

        //Joint Types
        public static DistanceJoint = 0;
        public static HingeJoint = 1;
        public static BallAndSocketJoint = 2;
        public static WheelJoint = 3;
        public static SliderJoint = 4;
        //OIMO
        public static PrismaticJoint = 5;
        //ENERGY FTW! (compare with this - http://ode-wiki.org/wiki/index.php?title=Manual:_Joint_Types_and_Functions)
        public static UniversalJoint = 6;
        public static Hinge2Joint = PhysicsJoint.WheelJoint;
        //Cannon
        //Similar to a Ball-Joint. Different in params
        public static PointToPointJoint = 8;
        //Cannon only at the moment
        public static SpringJoint = 9;
    }

    /**
     * A class representing a physics distance joint.
     */
    export class DistanceJoint extends PhysicsJoint {
        constructor(jointData: DistanceJointData) {
            super(PhysicsJoint.DistanceJoint, jointData);
        }

        /**
         * Update the predefined distance.
         */
        public updateDistance(maxDistance: number, minDistance?: number) {
            this._physicsPlugin.updateDistanceJoint(this, maxDistance, minDistance);
        }
    }

    /**
     * This class represents a single hinge physics joint
     */
    export class HingeJoint extends PhysicsJoint implements IMotorEnabledJoint {
        
        constructor(jointData:PhysicsJointData) {
            super(PhysicsJoint.HingeJoint, jointData);
        }
        
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        public setMotor(force?: number, maxForce?: number) {
            this._physicsPlugin.setMotor(this, force, maxForce);
        }
        
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        public setLimit(upperLimit: number, lowerLimit?: number) {
            this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
        }
    }
    
    /**
     * This class represents a dual hinge physics joint (same as wheel joint)
     */
    export class Hinge2Joint extends PhysicsJoint implements IMotorEnabledJoint {
        
        constructor(jointData:PhysicsJointData) {
            super(PhysicsJoint.Hinge2Joint, jointData);
        }
        
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        public setMotor(force?: number, maxForce?: number, motorIndex: number = 0) {
            this._physicsPlugin.setMotor(this, force, maxForce, motorIndex);
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

    export interface IMotorEnabledJoint {
        physicsJoint: any;
        setMotor(force?: number, maxForce?: number, motorIndex?: number);
        setLimit(upperLimit: number, lowerLimit?: number, motorIndex?: number);
    }

    export interface DistanceJointData extends PhysicsJointData {
        maxDistance: number;
        //Oimo - minDistance
        //Cannon - maxForce
    }

    export interface SpringJointData extends PhysicsJointData {
        length: number;
        stiffness: number;
        damping: number;
    }
}