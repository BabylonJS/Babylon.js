module BABYLON {
    // This matrix is used as a value to reset the bounding box.
    const _identityMatrix = Matrix.Identity();
    const _tempRadiusVector = new Vector3(0, 0, 0);

    export class BoundingSphere {
        public center: Vector3;
        public radius: number;
        public centerWorld: Vector3;
        public radiusWorld: number;
        public minimum: Vector3;
        public maximum: Vector3;

        /**
         * Creates a new bounding sphere
         * @param min defines the minimum vector (in local space)
         * @param max defines the maximum vector (in local space)
         */
        constructor(min: Vector3, max: Vector3) {
            this.center = Vector3.Zero();
            this.centerWorld = Vector3.Zero();
            this.reConstruct(min, max);
        }

        /**
         * Recreates the entire bounding sphere from scratch
         * @param min defines the new minimum vector (in local space)
         * @param max defines the new maximum vector (in local space) 
         */
        public reConstruct(min: Vector3, max: Vector3) {
            this.minimum = min.clone();
            this.maximum = max.clone()

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
            _tempRadiusVector.set(newRadius, newRadius, newRadius)

            let min = this.center.subtract(_tempRadiusVector);
            let max = this.center.add(_tempRadiusVector);

            this.reConstruct(min, max);

            return this;
        }

        // Methods
        /** @hidden */
        public _update(world: Matrix): void {
            Vector3.TransformCoordinatesToRef(this.center, world, this.centerWorld);
            Vector3.TransformNormalFromFloatsToRef(1.0, 1.0, 1.0, world, _tempRadiusVector);
            this.radiusWorld = Math.max(Math.abs(_tempRadiusVector.x), Math.abs(_tempRadiusVector.y), Math.abs(_tempRadiusVector.z)) * this.radius;
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            for (var i = 0; i < 6; i++) {
                if (frustumPlanes[i].dotCoordinate(this.centerWorld) <= -this.radiusWorld)
                    return false;
            }

            return true;
        }

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