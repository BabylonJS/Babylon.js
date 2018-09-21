module BABYLON {
    // This matrix is used as a value to reset the bounding box.
    const _identityMatrix = Matrix.Identity();

    /**
     * Class used to store bounding sphere information
     */
    export class BoundingSphere {
        /**
         * Gets the center of the bounding sphere in local space
         */
        public center: Vector3;
        /**
         * Radius of the bounding sphere in local space
         */
        public radius: number;
        /**
         * Gets the center of the bounding sphere in world space
         */
        public centerWorld: Vector3;
        /**
         * Radius of the bounding sphere in world space
         */
        public radiusWorld: number;
        /**
         * Gets the minimum vector in local space
         */
        public minimum: Vector3;
        /**
         * Gets the maximum vector in local space
         */
        public maximum: Vector3;

        /**
         * Creates a new bounding sphere
         * @param min defines the minimum vector (in local space)
         * @param max defines the maximum vector (in local space)
         */
        constructor(min: Vector3, max: Vector3) {
            this.center = Vector3.Zero();
            this.centerWorld = Vector3.Zero();
            this.minimum = Vector3.Zero();
            this.maximum = Vector3.Zero();
            this.reConstruct(min, max);
        }

        /**
         * Recreates the entire bounding sphere from scratch
         * @param min defines the new minimum vector (in local space)
         * @param max defines the new maximum vector (in local space) 
         */
        public reConstruct(min: Vector3, max: Vector3) {
            this.minimum.copyFrom(min);
            this.maximum.copyFrom(max);

            var distance = Vector3.Distance(min, max);

            Vector3.LerpToRef(min, max, 0.5, this.center);
            this.radius = distance * 0.5;

            this.centerWorld.set(0, 0, 0);
            this._update(_identityMatrix);
        }

        /**
         * Scale the current bounding sphere by applying a scale factor
         * @param factor defines the scale factor to apply
         * @returns the current bounding box
         */
        public scale(factor: number): BoundingSphere {
            let newRadius = this.radius * factor;
            const tempRadiusVector = Tmp.Vector3[0].set(newRadius, newRadius, newRadius);
            let min = Tmp.Vector3[1].copyFrom(this.center).subtractInPlace(tempRadiusVector);
            let max = Tmp.Vector3[2].copyFrom(this.center).addInPlace(tempRadiusVector);

            this.reConstruct(min, max);

            return this;
        }

        // Methods
        /** @hidden */
        public _update(world: Matrix): void {
            Vector3.TransformCoordinatesToRef(this.center, world, this.centerWorld);
            const tempVector = Tmp.Vector3[0];
            Vector3.TransformNormalFromFloatsToRef(1.0, 1.0, 1.0, world, tempVector);
            this.radiusWorld = Math.max(Math.abs(tempVector.x), Math.abs(tempVector.y), Math.abs(tempVector.z)) * this.radius;
        }

        /**
         * Tests if the bounding sphere is intersecting the frustum planes
         * @param frustumPlanes defines the frustum planes to test
         * @returns true if there is an intersection
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            for (var i = 0; i < 6; i++) {
                if (frustumPlanes[i].dotCoordinate(this.centerWorld) <= -this.radiusWorld)
                    return false;
            }

            return true;
        }

        /**
         * Tests if a point is inside the bounding sphere
         * @param point defines the point to test
         * @returns true if the point is inside the bounding sphere
         */
        public intersectsPoint(point: Vector3): boolean {
            var x = this.centerWorld.x - point.x;
            var y = this.centerWorld.y - point.y;
            var z = this.centerWorld.z - point.z;

            var distance = Math.sqrt((x * x) + (y * y) + (z * z));

            if (this.radiusWorld < distance)
                return false;

            return true;
        }

        // Statics
        /**
         * Checks if two sphere intersct
         * @param sphere0 sphere 0
         * @param sphere1 sphere 1
         * @returns true if the speres intersect
         */
        public static Intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean {
            var x = sphere0.centerWorld.x - sphere1.centerWorld.x;
            var y = sphere0.centerWorld.y - sphere1.centerWorld.y;
            var z = sphere0.centerWorld.z - sphere1.centerWorld.z;

            var distance = Math.sqrt((x * x) + (y * y) + (z * z));

            if (sphere0.radiusWorld + sphere1.radiusWorld < distance)
                return false;

            return true;
        }

    }
} 