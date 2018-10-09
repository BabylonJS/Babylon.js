module BABYLON {
    /**
     * Class used to store bounding sphere information
     */
    export class BoundingSphere {
        /**
         * Gets the center of the bounding sphere in local space
         */
        public center = Vector3.Zero();
        /**
         * Radius of the bounding sphere in local space
         */
        public radius: number;
        /**
         * Gets the center of the bounding sphere in world space
         */
        public centerWorld = Vector3.Zero();
        /**
         * Radius of the bounding sphere in world space
         */
        public radiusWorld: number;
        /**
         * Gets the minimum vector in local space
         */
        public minimum = Vector3.Zero();
        /**
         * Gets the maximum vector in local space
         */
        public maximum = Vector3.Zero();

        private static readonly TmpVector3 = Tools.BuildArray(3, Vector3.Zero);
        // This matrix is used as a value to reset the bounding box.
        private static readonly _identityMatrix = Matrix.Identity();

        /**
         * Creates a new bounding sphere
         * @param min defines the minimum vector (in local space)
         * @param max defines the maximum vector (in local space)
         * @param worldMatrix defines the new world matrix
         */
        constructor(min: Vector3, max: Vector3, worldMatrix?: Matrix) {
            this.reConstruct(min, max, worldMatrix);
        }

        /**
         * Recreates the entire bounding sphere from scratch
         * @param min defines the new minimum vector (in local space)
         * @param max defines the new maximum vector (in local space)
         * @param worldMatrix defines the new world matrix
         */
        public reConstruct(min: Vector3, max: Vector3, worldMatrix?: Matrix) {
            this.minimum.copyFrom(min);
            this.maximum.copyFrom(max);

            var distance = Vector3.Distance(min, max);

            max.addToRef(min, this.center).scaleInPlace(0.5);
            this.radius = distance * 0.5;

            this._update(worldMatrix || BoundingSphere._identityMatrix);
        }

        /**
         * Scale the current bounding sphere by applying a scale factor
         * @param factor defines the scale factor to apply
         * @returns the current bounding box
         */
        public scale(factor: number): BoundingSphere {
            const newRadius = this.radius * factor;
            const tmpVectors = BoundingSphere.TmpVector3;
            const tempRadiusVector = tmpVectors[0].setAll(newRadius);
            const min = this.center.subtractToRef(tempRadiusVector, tmpVectors[1]);
            const max = this.center.addToRef(tempRadiusVector, tmpVectors[2]);

            this.reConstruct(min, max);

            return this;
        }

        // Methods
        /** @hidden */
        public _update(worldMatrix: Matrix): void {
            if (worldMatrix !== BoundingSphere._identityMatrix) {
                Vector3.TransformCoordinatesToRef(this.center, worldMatrix, this.centerWorld);
                const tempVector = BoundingSphere.TmpVector3[0];
                Vector3.TransformNormalFromFloatsToRef(1.0, 1.0, 1.0, worldMatrix, tempVector);
                this.radiusWorld = Math.max(Math.abs(tempVector.x), Math.abs(tempVector.y), Math.abs(tempVector.z)) * this.radius;
            }
            else {
                this.centerWorld.copyFrom(this.center);
                this.radiusWorld = this.radius;
            }
        }

        /**
         * Tests if the bounding sphere is intersecting the frustum planes
         * @param frustumPlanes defines the frustum planes to test
         * @returns true if there is an intersection
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            for (var i = 0; i < 6; i++) {
                if (frustumPlanes[i].dotCoordinate(this.centerWorld) <= -this.radiusWorld) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Tests if a point is inside the bounding sphere
         * @param point defines the point to test
         * @returns true if the point is inside the bounding sphere
         */
        public intersectsPoint(point: Vector3): boolean {
            const squareDistance = Vector3.DistanceSquared(this.centerWorld, point);
            if (this.radiusWorld * this.radiusWorld < squareDistance) {
                return false;
            }

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
            const squareDistance = Vector3.DistanceSquared(sphere0.centerWorld, sphere1.centerWorld);
            const radiusSum = sphere0.radiusWorld + sphere1.radiusWorld;

            if (radiusSum * radiusSum < squareDistance) {
                return false;
            }

            return true;
        }
    }
}