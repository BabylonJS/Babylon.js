var BABYLON;
(function (BABYLON) {
    var BoundingSphere = (function () {
        function BoundingSphere(minimum, maximum) {
            this.minimum = minimum;
            this.maximum = maximum;
            this._tempRadiusVector = BABYLON.Vector3.Zero();
            var distance = BABYLON.Vector3.Distance(minimum, maximum);
            this.center = BABYLON.Vector3.Lerp(minimum, maximum, 0.5);
            this.radius = distance * 0.5;
            this.centerWorld = BABYLON.Vector3.Zero();
            this._update(BABYLON.Matrix.Identity());
        }
        // Methods
        BoundingSphere.prototype._update = function (world) {
            BABYLON.Vector3.TransformCoordinatesToRef(this.center, world, this.centerWorld);
            BABYLON.Vector3.TransformNormalFromFloatsToRef(1.0, 1.0, 1.0, world, this._tempRadiusVector);
            this.radiusWorld = Math.max(Math.abs(this._tempRadiusVector.x), Math.abs(this._tempRadiusVector.y), Math.abs(this._tempRadiusVector.z)) * this.radius;
        };
        BoundingSphere.prototype.isInFrustum = function (frustumPlanes) {
            for (var i = 0; i < 6; i++) {
                if (frustumPlanes[i].dotCoordinate(this.centerWorld) <= -this.radiusWorld)
                    return false;
            }
            return true;
        };
        BoundingSphere.prototype.intersectsPoint = function (point) {
            var x = this.centerWorld.x - point.x;
            var y = this.centerWorld.y - point.y;
            var z = this.centerWorld.z - point.z;
            var distance = Math.sqrt((x * x) + (y * y) + (z * z));
            if (Math.abs(this.radiusWorld - distance) < BABYLON.Epsilon)
                return false;
            return true;
        };
        // Statics
        BoundingSphere.Intersects = function (sphere0, sphere1) {
            var x = sphere0.centerWorld.x - sphere1.centerWorld.x;
            var y = sphere0.centerWorld.y - sphere1.centerWorld.y;
            var z = sphere0.centerWorld.z - sphere1.centerWorld.z;
            var distance = Math.sqrt((x * x) + (y * y) + (z * z));
            if (sphere0.radiusWorld + sphere1.radiusWorld < distance)
                return false;
            return true;
        };
        return BoundingSphere;
    })();
    BABYLON.BoundingSphere = BoundingSphere;
})(BABYLON || (BABYLON = {}));
