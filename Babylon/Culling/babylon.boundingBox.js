var BABYLON = BABYLON || {};

(function () {
    BABYLON.BoundingBox = function (minimum, maximum) {
        this.minimum = minimum;
        this.maximum = maximum;
        
        // Bounding vectors
        this.vectors = [];

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
        this.extends = this.maximum.subtract(this.minimum).scale(0.5);
        this.directions = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];

        // World
        this.vectorsWorld = [];
        for (var index = 0; index < this.vectors.length; index++) {
            this.vectorsWorld[index] = BABYLON.Vector3.Zero();
        }
        this.minimumWorld = BABYLON.Vector3.Zero();
        this.maximumWorld = BABYLON.Vector3.Zero();
    };

    // Methods
    BABYLON.BoundingBox.prototype._update = function (world) {
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

        BABYLON.Vector3.FromArrayToRef(world.m, 0, this.directions[0]);
        BABYLON.Vector3.FromArrayToRef(world.m, 4, this.directions[1]);
        BABYLON.Vector3.FromArrayToRef(world.m, 8, this.directions[2]);
    };

    BABYLON.BoundingBox.prototype.isInFrustrum = function (frustumPlanes) {
        return BABYLON.BoundingBox.IsInFrustrum(this.vectorsWorld, frustumPlanes);
    };

    BABYLON.BoundingBox.prototype.intersectsPoint = function (point) {
        if (this.maximumWorld.x < point.x || this.minimumWorld.x > point.x)
            return false;

        if (this.maximumWorld.y < point.y || this.minimumWorld.y > point.y)
            return false;

        if (this.maximumWorld.z < point.z || this.minimumWorld.z > point.z)
            return false;

        return true;
    };

    BABYLON.BoundingBox.prototype.intersectsSphere = function (sphere) {
        var vector = BABYLON.Vector3.Clamp(sphere.centerWorld, this.minimumWorld, this.maximumWorld);
        var num = BABYLON.Vector3.DistanceSquared(sphere.centerWorld, vector);
        return (num <= (sphere.radiusWorld * sphere.radiusWorld));
    };

    BABYLON.BoundingBox.prototype.intersectsMinMax = function (min, max) {
        if (this.maximumWorld.x < min.x || this.minimumWorld.x > max.x)
            return false;

        if (this.maximumWorld.y < min.y || this.minimumWorld.y > max.y)
            return false;

        if (this.maximumWorld.z < min.z || this.minimumWorld.z > max.z)
            return false;

        return true;
    };

    // Statics
    BABYLON.BoundingBox.intersects = function (box0, box1) {
        if (box0.maximumWorld.x < box1.minimumWorld.x || box0.minimumWorld.x > box1.maximumWorld.x)
            return false;

        if (box0.maximumWorld.y < box1.minimumWorld.y || box0.minimumWorld.y > box1.maximumWorld.y)
            return false;

        if (box0.maximumWorld.z < box1.minimumWorld.z || box0.minimumWorld.z > box1.maximumWorld.z)
            return false;

        return true;
    };
    
    BABYLON.BoundingBox.IsInFrustrum = function (boundingVectors, frustumPlanes) {
        for (var p = 0; p < 6; p++) {
            var inCount = 8;

            for (var i = 0; i < 8; i++) {
                if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
                    --inCount;
                } else {
                    break;
                }
            }
            if (inCount == 0)
                return false;
        }
        return true;
    };

})();