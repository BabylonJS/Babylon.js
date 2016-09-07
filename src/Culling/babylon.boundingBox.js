var BABYLON;
(function (BABYLON) {
    var BoundingBox = (function () {
        function BoundingBox(minimum, maximum) {
            this.minimum = minimum;
            this.maximum = maximum;
            this.vectors = new Array();
            this.vectorsWorld = new Array();
            // Bounding vectors
            this.vectors.push(this.minimum.clone());
            this.vectors.push(this.maximum.clone());
            this.vectors.push(this.minimum.clone());
            this.vectors[2].x = this.maximum.x;
            this.vectors.push(this.minimum.clone());
            this.vectors[3].y = this.maximum.y;
            this.vectors.push(this.minimum.clone());
            this.vectors[4].z = this.maximum.z;
            this.vectors.push(this.maximum.clone());
            this.vectors[5].z = this.minimum.z;
            this.vectors.push(this.maximum.clone());
            this.vectors[6].x = this.minimum.x;
            this.vectors.push(this.maximum.clone());
            this.vectors[7].y = this.minimum.y;
            // OBB
            this.center = this.maximum.add(this.minimum).scale(0.5);
            this.extendSize = this.maximum.subtract(this.minimum).scale(0.5);
            this.directions = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
            // World
            for (var index = 0; index < this.vectors.length; index++) {
                this.vectorsWorld[index] = BABYLON.Vector3.Zero();
            }
            this.minimumWorld = BABYLON.Vector3.Zero();
            this.maximumWorld = BABYLON.Vector3.Zero();
            this._update(BABYLON.Matrix.Identity());
        }
        // Methods
        BoundingBox.prototype.getWorldMatrix = function () {
            return this._worldMatrix;
        };
        BoundingBox.prototype.setWorldMatrix = function (matrix) {
            this._worldMatrix.copyFrom(matrix);
            return this;
        };
        BoundingBox.prototype._update = function (world) {
            BABYLON.Vector3.FromFloatsToRef(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this.minimumWorld);
            BABYLON.Vector3.FromFloatsToRef(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this.maximumWorld);
            for (var index = 0; index < this.vectors.length; index++) {
                var v = this.vectorsWorld[index];
                BABYLON.Vector3.TransformCoordinatesToRef(this.vectors[index], world, v);
                if (v.x < this.minimumWorld.x)
                    this.minimumWorld.x = v.x;
                if (v.y < this.minimumWorld.y)
                    this.minimumWorld.y = v.y;
                if (v.z < this.minimumWorld.z)
                    this.minimumWorld.z = v.z;
                if (v.x > this.maximumWorld.x)
                    this.maximumWorld.x = v.x;
                if (v.y > this.maximumWorld.y)
                    this.maximumWorld.y = v.y;
                if (v.z > this.maximumWorld.z)
                    this.maximumWorld.z = v.z;
            }
            // OBB
            this.maximumWorld.addToRef(this.minimumWorld, this.center);
            this.center.scaleInPlace(0.5);
            BABYLON.Vector3.FromFloatArrayToRef(world.m, 0, this.directions[0]);
            BABYLON.Vector3.FromFloatArrayToRef(world.m, 4, this.directions[1]);
            BABYLON.Vector3.FromFloatArrayToRef(world.m, 8, this.directions[2]);
            this._worldMatrix = world;
        };
        BoundingBox.prototype.isInFrustum = function (frustumPlanes) {
            return BoundingBox.IsInFrustum(this.vectorsWorld, frustumPlanes);
        };
        BoundingBox.prototype.isCompletelyInFrustum = function (frustumPlanes) {
            return BoundingBox.IsCompletelyInFrustum(this.vectorsWorld, frustumPlanes);
        };
        BoundingBox.prototype.intersectsPoint = function (point) {
            var delta = -BABYLON.Epsilon;
            if (this.maximumWorld.x - point.x < delta || delta > point.x - this.minimumWorld.x)
                return false;
            if (this.maximumWorld.y - point.y < delta || delta > point.y - this.minimumWorld.y)
                return false;
            if (this.maximumWorld.z - point.z < delta || delta > point.z - this.minimumWorld.z)
                return false;
            return true;
        };
        BoundingBox.prototype.intersectsSphere = function (sphere) {
            return BoundingBox.IntersectsSphere(this.minimumWorld, this.maximumWorld, sphere.centerWorld, sphere.radiusWorld);
        };
        BoundingBox.prototype.intersectsMinMax = function (min, max) {
            if (this.maximumWorld.x < min.x || this.minimumWorld.x > max.x)
                return false;
            if (this.maximumWorld.y < min.y || this.minimumWorld.y > max.y)
                return false;
            if (this.maximumWorld.z < min.z || this.minimumWorld.z > max.z)
                return false;
            return true;
        };
        // Statics
        BoundingBox.Intersects = function (box0, box1) {
            if (box0.maximumWorld.x < box1.minimumWorld.x || box0.minimumWorld.x > box1.maximumWorld.x)
                return false;
            if (box0.maximumWorld.y < box1.minimumWorld.y || box0.minimumWorld.y > box1.maximumWorld.y)
                return false;
            if (box0.maximumWorld.z < box1.minimumWorld.z || box0.minimumWorld.z > box1.maximumWorld.z)
                return false;
            return true;
        };
        BoundingBox.IntersectsSphere = function (minPoint, maxPoint, sphereCenter, sphereRadius) {
            var vector = BABYLON.Vector3.Clamp(sphereCenter, minPoint, maxPoint);
            var num = BABYLON.Vector3.DistanceSquared(sphereCenter, vector);
            return (num <= (sphereRadius * sphereRadius));
        };
        BoundingBox.IsCompletelyInFrustum = function (boundingVectors, frustumPlanes) {
            for (var p = 0; p < 6; p++) {
                for (var i = 0; i < 8; i++) {
                    if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
                        return false;
                    }
                }
            }
            return true;
        };
        BoundingBox.IsInFrustum = function (boundingVectors, frustumPlanes) {
            for (var p = 0; p < 6; p++) {
                var inCount = 8;
                for (var i = 0; i < 8; i++) {
                    if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
                        --inCount;
                    }
                    else {
                        break;
                    }
                }
                if (inCount === 0)
                    return false;
            }
            return true;
        };
        return BoundingBox;
    })();
    BABYLON.BoundingBox = BoundingBox;
})(BABYLON || (BABYLON = {}));
