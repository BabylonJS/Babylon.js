var BABYLON = BABYLON || {};

(function () {
    BABYLON.BoundingInfo = function (minimum, maximum) {
        this.boundingBox = new BABYLON.BoundingBox(minimum, maximum);
        this.boundingSphere = new BABYLON.BoundingSphere(minimum, maximum);
    };

    // Methods
    BABYLON.BoundingInfo.prototype._update = function (world, scale) {
        this.boundingBox._update(world);
        this.boundingSphere._update(world, scale);
    };

    var extentsOverlap = function (min0, max0, min1, max1) {
        return !(min0 > max1 || min1 > max0);
    };

    var computeBoxExtents = function (axis, box) {
        var p = BABYLON.Vector3.Dot(box.center, axis);

        var r0 = Math.abs(BABYLON.Vector3.Dot(box.directions[0], axis)) * box.extends.x;
        var r1 = Math.abs(BABYLON.Vector3.Dot(box.directions[1], axis)) * box.extends.y;
        var r2 = Math.abs(BABYLON.Vector3.Dot(box.directions[2], axis)) * box.extends.z;

        var r = r0 + r1 + r2;
        return {
            min: p - r,
            max: p + r
        };
    };

    var axisOverlap = function (axis, box0, box1) {
        var result0 = computeBoxExtents(axis, box0);
        var result1 = computeBoxExtents(axis, box1);

        return extentsOverlap(result0.min, result0.max, result1.min, result1.max);
    };

    BABYLON.BoundingInfo.prototype.isInFrustrum = function (frustumPlanes) {
        if (!this.boundingSphere.isInFrustrum(frustumPlanes))
            return false;

        return this.boundingBox.isInFrustrum(frustumPlanes);
    };

    BABYLON.BoundingInfo.prototype._checkCollision = function (collider) {
        return collider._canDoCollision(this.boundingSphere.centerWorld, this.boundingSphere.radiusWorld, this.boundingBox.minimumWorld, this.boundingBox.maximumWorld);
    };

    BABYLON.BoundingInfo.prototype.intersectsPoint = function(point) {
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

    BABYLON.BoundingInfo.prototype.intersects = function (boundingInfo, precise) {
        if (!this.boundingSphere.centerWorld || !boundingInfo.boundingSphere.centerWorld) {
            return false;
        }

        if (!BABYLON.BoundingSphere.intersects(this.boundingSphere, boundingInfo.boundingSphere)) {
            return false;
        }

        if (!BABYLON.BoundingBox.intersects(this.boundingBox, boundingInfo.boundingBox)) {
            return false;
        }

        if (!precise) {
            return true;
        }

        var box0 = this.boundingBox;
        var box1 = boundingInfo.boundingBox;

        if (!axisOverlap(box0.directions[0], box0, box1)) return false;
        if (!axisOverlap(box0.directions[1], box0, box1)) return false;
        if (!axisOverlap(box0.directions[2], box0, box1)) return false;
        if (!axisOverlap(box1.directions[0], box0, box1)) return false;
        if (!axisOverlap(box1.directions[1], box0, box1)) return false;
        if (!axisOverlap(box1.directions[2], box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[0], box1.directions[0]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[0], box1.directions[1]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[0], box1.directions[2]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[1], box1.directions[0]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[1], box1.directions[1]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[1], box1.directions[2]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[2], box1.directions[0]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[2], box1.directions[1]), box0, box1)) return false;
        if (!axisOverlap(BABYLON.Vector3.Cross(box0.directions[2], box1.directions[2]), box0, box1)) return false;

        return true;
    };

})();