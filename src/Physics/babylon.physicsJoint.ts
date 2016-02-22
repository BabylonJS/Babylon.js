module BABYLON {

    export interface PhysicsJointData {
        //Important for some engines, optional!
        mainPivot?: Vector3;
        connectedPivot?: Vector3;
        mainAxis?: Vector3,
        connectedAxis?: Vector3,
        collision?: boolean //native in oimo, needs this - https://github.com/schteppe/cannon.js/blob/gh-pages/demos/collisionFilter.html in cannon
        //Native Oimo/Cannon/Energy data
        nativeParams?: any;
    }

    export class PhysicsJoint {
        
        private _physicsJoint;
        
        constructor(public type: number, public jointData: PhysicsJointData) {
            jointData.nativeParams = jointData.nativeParams || {};
        }
        
        public get physicsJoint() {
            return this._physicsJoint;
        }
        
        public set physicsJoint(newJoint: any) {
            
            if(this._physicsJoint) {
                //remove from the wolrd
            }
            
            this._physicsJoint = newJoint;
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
        public static Hinge2Joint = 7;
        //Cannon
        //Similar to a Ball-Joint. Different in params
        //TODO check!!
        public static PointToPointJoint = 8;

    }
    
    export interface DistanceJointData extends PhysicsJointData {
        maxDistance: number;
        //Oimo - minDistance
        //Cannon - maxForce
    }
}