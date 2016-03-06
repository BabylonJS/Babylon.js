var BABYLON;
(function (BABYLON) {
    var PhysicsJoint = (function () {
        function PhysicsJoint(type, jointData) {
            this.type = type;
            this.jointData = jointData;
            jointData.nativeParams = jointData.nativeParams || {};
        }
        Object.defineProperty(PhysicsJoint.prototype, "physicsJoint", {
            get: function () {
                return this._physicsJoint;
            },
            set: function (newJoint) {
                if (this._physicsJoint) {
                }
                this._physicsJoint = newJoint;
            },
            enumerable: true,
            configurable: true
        });
        //TODO check if the native joints are the same
        //Joint Types
        PhysicsJoint.DistanceJoint = 0;
        PhysicsJoint.HingeJoint = 1;
        PhysicsJoint.BallAndSocketJoint = 2;
        PhysicsJoint.WheelJoint = 3;
        PhysicsJoint.SliderJoint = 4;
        //OIMO
        PhysicsJoint.PrismaticJoint = 5;
        //ENERGY FTW! (compare with this - http://ode-wiki.org/wiki/index.php?title=Manual:_Joint_Types_and_Functions)
        PhysicsJoint.UniversalJoint = 6;
        PhysicsJoint.Hinge2Joint = 7;
        //Cannon
        //Similar to a Ball-Joint. Different in params
        //TODO check!!
        PhysicsJoint.PointToPointJoint = 8;
        //Cannon only at the moment
        PhysicsJoint.SpringJoint = 9;
        return PhysicsJoint;
    }());
    BABYLON.PhysicsJoint = PhysicsJoint;
})(BABYLON || (BABYLON = {}));
