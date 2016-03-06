var BABYLON;
(function (BABYLON) {
    var computeBoxExtents = function (axis, box) {
        var p = BABYLON.Vector3.Dot(box.center, axis);
        var r0 = Math.abs(BABYLON.Vector3.Dot(box.directions[0], axis)) * box.extendSize.x;
        var r1 = Math.abs(BABYLON.Vector3.Dot(box.directions[1], axis)) * box.extendSize.y;
        var r2 = Math.abs(BABYLON.Vector3.Dot(box.directions[2], axis)) * box.extendSize.z;
        var r = r0 + r1 + r2;
        return {
            min: p - r,
            max: p + r
        };
    };
    var extentsOverlap = function (min0, max0, min1, max1) { return !(min0 > max1 || min1 > max0); };
    var axisOverlap = function (axis, box0, box1) {
        var result0 = computeBoxExtents(axis, box0);
        var result1 = computeBoxExtents(axis, box1);
        return extentsOverlap(result0.min, result0.max, result1.min, result1.max);
    };
    var BoundingInfo = (function () {
        function BoundingInfo(minimum, maximum) {
            this.minimum = minimum;
            this.maximum = maximum;
            this._isLocked = false;
            this.boundingBox = new BABYLON.BoundingBox(minimum, maximum);
            this.boundingSphere = new BABYLON.BoundingSphere(minimum, maximum);
        }
        Object.defineProperty(BoundingInfo.prototype, "isLocked", {
            get: function () {
                return this._isLocked;
            },
            set: function (value) {
                this._isLocked = value;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        BoundingInfo.prototype.update = function (world) {
            if (this._isLocked) {
                return;
            }
            this.boundingBox._update(world);
            this.boundingSphere._update(world);
        };
        BoundingInfo.prototype.isInFrustum = function (frustumPlanes) {
            if (!this.boundingSphere.isInFrustum(frustumPlanes))
                return false;
            return this.boundingBox.isInFrustum(frustumPlanes);
        };
        BoundingInfo.prototype.isCompletelyInFrustum = function (frustumPlanes) {
            return this.boundingBox.isCompletelyInFrustum(frustumPlanes);
        };
        BoundingInfo.prototype._checkCollision = function (collider) {
            return collider._canDoCollision(this.boundingSphere.centerWorld, this.boundingSphere.radiusWorld, this.boundingBox.minimumWorld, this.boundingBox.maximumWorld);
        };
        BoundingInfo.prototype.intersectsPoint = function (point) {
            if (!this.boundingSphere.centerWorld) {
                return false;
            }
            if (!this.boundingSphere.intersectsPoint(point)) {
                return false;
            }
            if (!this.boundingBox.intersectsPoint(point)) {
                return false;
            }
            return true;
        };
        BoundingInfo.prototype.intersects = function (boundingInfo, precise) {
            if (!this.boundingSphere.centerWorld || !boundingInfo.boundingSphere.centerWorld) {
                return false;
            }
            if (!BABYLON.BoundingSphere.Intersects(this.boundingSphere, boundingInfo.boundingSphere)) {
                return false;
            }
            if (!BABYLON.BoundingBox.Intersects(this.boundingBox, boundingInfo.boundingBox)) {
                return false;
            }
            if (!precise) {
                return true;
            }
            var box0 = this.boundingBox;
            var box1 = boundingInfo.boundingBox;
            if (!axisOverlap(box0.directions[0], box0, box1))
                return false;
            if (!axisOverlap(box0.directions[1], box0, box1))
                return false;
            if (!axisOverlap(box0.directions[2], box0, box1))
                return false;
            if (!axisOverlap(box1.directions[0], box0, box1))
                return false;
            if (!axisOverlap(box1.directions[1], box0, box1))
                return false;
            if (!axisOverlap(box1.directions[2], box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[0], box1.directions[0]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[0], box1.directions[1]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[0], box1.directions[2]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[1], box1.directions[0]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[1], box1.directions[1]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[1], box1.directions[2]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[2], box1.directions[0]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[2], box1.directions[1]), box0, box1))
                return false;
            if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[2], box1.directions[2]), box0, box1))
                return false;
            return true;
        };
        return BoundingInfo;
    }());
    BABYLON.BoundingInfo = BoundingInfo;
})(BABYLON || (BABYLON = {}));
