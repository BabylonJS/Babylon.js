var BABYLON = BABYLON || {};

(function () {
    BABYLON.CollisionPlane = function (origin, normal) {
        this.normal = normal;
        this.origin = origin;

        normal.normalize();

        this.equation = [];
        this.equation[0] = normal.x;
        this.equation[1] = normal.y;
        this.equation[2] = normal.z;
        this.equation[3] = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
    };

    // Methods
    BABYLON.CollisionPlane.prototype.isFrontFacingTo = function (direction, epsilon) {
        var dot = BABYLON.Vector3.Dot(this.normal, direction);

        return (dot <= epsilon);
    };

    BABYLON.CollisionPlane.prototype.signedDistanceTo = function (point) {
        return BABYLON.Vector3.Dot(point, this.normal) + this.equation[3];
    };

    // Statics
    BABYLON.CollisionPlane.CreateFromPoints = function (p1, p2, p3) {
        var normal = BABYLON.Vector3.Cross(p2.subtract(p1), p3.subtract(p1));

        return new BABYLON.CollisionPlane(p1, normal);
    };
})();