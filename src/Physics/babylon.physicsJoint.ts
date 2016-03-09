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
        
        public executeNativeFunction(func : (physicsJoint:any) => void) {
            func(this._physicsJoint)
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
        //TODO check!!
        public static PointToPointJoint = 8;
        //Cannon only at the moment
        public static SpringJoint = 9;
    }

    export class DistanceJoint extends PhysicsJoint {
        constructor(jointData: DistanceJointData) {
            super(PhysicsJoint.DistanceJoint, jointData);
        }

        public updateDistance(maxDistance: number, minDistance?: number) {
            this._physicsPlugin.updateDistanceJoint(this, maxDistance, minDistance);
        }
    }

    export class HingeJoint extends PhysicsJoint implements IMotorEnabledJoint {
        
        constructor(jointData:PhysicsJointData) {
            super(PhysicsJoint.HingeJoint, jointData);
        }
        
        public setMotor(force?: number, maxForce?: number) {
            this._physicsPlugin.setMotor(this, force, maxForce);
        }
        
        public setLimit(upperLimit: number, lowerLimit?: number) {
            this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
        }
    }
    
    export class Hinge2Joint extends PhysicsJoint implements IMotorEnabledJoint {
        
        constructor(jointData:PhysicsJointData) {
            super(PhysicsJoint.Hinge2Joint, jointData);
        }
        
        public setMotor(force?: number, maxForce?: number, motorIndex: number = 0) {
            this._physicsPlugin.setMotor(this, force, maxForce, motorIndex);
        }
        
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