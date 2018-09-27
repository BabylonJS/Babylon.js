module BABYLON {
    /**
     * Class used to store bounding box information
     */
    export class BoundingBox implements ICullable {
        /**
         * Gets the 8 vectors representing the bounding box in local space
         */
        public vectors: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
        /**
         * Gets the center of the bounding box in local space
         */
        public center: Vector3 = Vector3.Zero();
        /**
         * Gets the center of the bounding box in world space
         */
        public centerWorld: Vector3 = Vector3.Zero();
        /**
         * Gets the extend size in local space
         */
        public extendSize: Vector3 = Vector3.Zero();
        /**
         * Gets the extend size in world space
         */
        public extendSizeWorld: Vector3 = Vector3.Zero();
        /**
         * Gets the OBB (object bounding box) directions
         */
        public directions: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
        /**
         * Gets the 8 vectors representing the bounding box in world space
         */
        public vectorsWorld: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
        /**
         * Gets the minimum vector in world space
         */
        public minimumWorld: Vector3 = Vector3.Zero();
        /**
         * Gets the maximum vector in world space
         */
        public maximumWorld: Vector3 = Vector3.Zero();
        /**
         * Gets the minimum vector in local space
         */
        public minimum: Vector3 = Vector3.Zero();
        /**
         * Gets the maximum vector in local space
         */
        public maximum: Vector3 = Vector3.Zero();

        private _worldMatrix: Matrix;

        /**
         * @hidden
         */
        public _tag: number;

        /**
         * Creates a new bounding box
         * @param min defines the minimum vector (in local space)
         * @param max defines the maximum vector (in local space)
         * @param worldMatrix defines the new world matrix
         */
        constructor(min: Vector3, max: Vector3, worldMatrix?: Matrix) {
            this.reConstruct(min, max, worldMatrix);
        }

        // Methods

        /**
         * Recreates the entire bounding box from scratch
         * @param min defines the new minimum vector (in local space)
         * @param max defines the new maximum vector (in local space)
         * @param worldMatrix defines the new world matrix
         */
        public reConstruct(min: Vector3, max: Vector3, worldMatrix?: Matrix) {
            const minX = min.x, minY = min.y, minZ = min.z, maxX = max.x, maxY = max.y, maxZ = max.z;
            const vectors = this.vectors;

            this.minimum.copyFromFloats(minX, minY, minZ);
            this.maximum.copyFromFloats(maxX, maxY, maxZ);
            vectors[0].copyFromFloats(minX, minY, minZ);
            vectors[1].copyFromFloats(maxX, maxY, maxZ);
            vectors[2].copyFromFloats(maxX, minY, minZ);
            vectors[3].copyFromFloats(minX, maxY, minZ);
            vectors[4].copyFromFloats(minX, minY, maxZ);
            vectors[5].copyFromFloats(maxX, maxY, minZ);
            vectors[6].copyFromFloats(minX, maxY, maxZ);
            vectors[7].copyFromFloats(maxX, minY, maxZ);

            // OBB
            this.maximum.addToRef(min, this.center).scaleInPlace(0.5);
            this.maximum.subtractToRef(max, this.extendSize).scaleInPlace(0.5);

            this._update(worldMatrix || this._worldMatrix || Matrix.Identity());
        }

        /**
         * Scale the current bounding box by applying a scale factor
         * @param factor defines the scale factor to apply
         * @returns the current bounding box
         */
        public scale(factor: number): BoundingBox {
            const tmpVectors = Tmp.Vector3;
            const diff = this.maximum.subtractToRef(this.minimum, tmpVectors[0]);
            const len = diff.length();
            diff.normalizeFromLength(len);
            const distance = len * factor;
            const newRadius = diff.scaleInPlace(distance * 0.5);

            const min = this.center.subtractToRef(newRadius, tmpVectors[1]);
            const max = this.center.addToRef(newRadius, tmpVectors[2]);

            this.reConstruct(min, max);

            return this;
        }

        /**
         * Gets the world matrix of the bounding box
         * @returns a matrix
         */
        public getWorldMatrix(): Matrix {
            return this._worldMatrix;
        }

        /**
         * Sets the world matrix stored in the bounding box
         * @param matrix defines the matrix to store
         * @returns current bounding box
         */
        public setWorldMatrix(matrix: Matrix): BoundingBox {
            this._worldMatrix.copyFrom(matrix);
            return this;
        }

        /** @hidden */
        public _update(world: Matrix): void {
            const minWorld = this.minimumWorld;
            const maxWorld = this.maximumWorld;
            const directions = this.directions;

            minWorld.setAll(Number.MAX_VALUE);
            maxWorld.setAll(-Number.MAX_VALUE);

            const vectorsWorld = this.vectorsWorld;
            const vectors = this.vectors;
            for (let index = 0; index < 8; ++index) {
                const v = vectorsWorld[index];
                Vector3.TransformCoordinatesToRef(vectors[index], world, v);
                minWorld.minimizeInPlace(v);
                maxWorld.maximizeInPlace(v);
            }

            // Extend
            maxWorld.subtractToRef(minWorld, this.extendSizeWorld).scaleInPlace(0.5);
            // OOBB
            maxWorld.addToRef(minWorld, this.centerWorld).scaleInPlace(0.5);

            Vector3.FromArrayToRef(world.m, 0, directions[0]);
            Vector3.FromArrayToRef(world.m, 4, directions[1]);
            Vector3.FromArrayToRef(world.m, 8, directions[2]);

            this._worldMatrix = world;
        }

        /**
         * Tests if the bounding box is intersecting the frustum planes
         * @param frustumPlanes defines the frustum planes to test
         * @returns true if there is an intersection
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return BoundingBox.IsInFrustum(this.vectorsWorld, frustumPlanes);
        }

        /**
         * Tests if the bounding box is entirely inside the frustum planes
         * @param frustumPlanes defines the frustum planes to test
         * @returns true if there is an inclusion
         */
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return BoundingBox.IsCompletelyInFrustum(this.vectorsWorld, frustumPlanes);
        }

        /**
         * Tests if a point is inside the bounding box
         * @param point defines the point to test
         * @returns true if the point is inside the bounding box
         */
        public intersectsPoint(point: Vector3): boolean {
            const min = this.minimumWorld;
            const max = this.maximumWorld;
            const minX = min.x, minY = min.y, minZ = min.z, maxX = max.x, maxY = max.y, maxZ = max.z;
            const pointX = point.x, pointY = point.y, pointZ = point.z;
            var delta = -Epsilon;

            if (maxX - pointX < delta || delta > pointX - minX) {
                return false;
            }

            if (maxY - pointY < delta || delta > pointY - minY) {
                return false;
            }

            if (maxZ - pointZ < delta || delta > pointZ - minZ) {
                return false;
            }

            return true;
        }

        /**
         * Tests if the bounding box intersects with a bounding sphere
         * @param sphere defines the sphere to test
         * @returns true if there is an intersection
         */
        public intersectsSphere(sphere: BoundingSphere): boolean {
            return BoundingBox.IntersectsSphere(this.minimumWorld, this.maximumWorld, sphere.centerWorld, sphere.radiusWorld);
        }

        /**
         * Tests if the bounding box intersects with a box defined by a min and max vectors
         * @param min defines the min vector to use
         * @param max defines the max vector to use
         * @returns true if there is an intersection
         */
        public intersectsMinMax(min: Vector3, max: Vector3): boolean {
            const myMin = this.minimumWorld;
            const myMax = this.maximumWorld;
            const myMinX = myMin.x, myMinY = myMin.y, myMinZ = myMin.z, myMaxX = myMax.x, myMaxY = myMax.y, myMaxZ = myMax.z;
            const minX = min.x, minY = min.y, minZ = min.z, maxX = max.x, maxY = max.y, maxZ = max.z;
            if (myMaxX < minX || myMinX > maxX) {
                return false;
            }

            if (myMaxY < minY || myMinY > maxY) {
                return false;
            }

            if (myMaxZ < minZ || myMinZ > maxZ) {
                return false;
            }

            return true;
        }

        // Statics

        /**
         * Tests if two bounding boxes are intersections
         * @param box0 defines the first box to test
         * @param box1 defines the second box to test
         * @returns true if there is an intersection
         */
        public static Intersects(box0: BoundingBox, box1: BoundingBox): boolean {
            return box0.intersectsMinMax(box1.minimumWorld, box1.maximumWorld)
        }

        /**
         * Tests if a bounding box defines by a min/max vectors intersects a sphere
         * @param minPoint defines the minimum vector of the bounding box
         * @param maxPoint defines the maximum vector of the bounding box
         * @param sphereCenter defines the sphere center
         * @param sphereRadius defines the sphere radius
         * @returns true if there is an intersection
         */
        public static IntersectsSphere(minPoint: Vector3, maxPoint: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean {
            var vector = Vector3.Clamp(sphereCenter, minPoint, maxPoint);
            var num = Vector3.DistanceSquared(sphereCenter, vector);
            return (num <= (sphereRadius * sphereRadius));
        }

        /**
         * Tests if a bounding box defined with 8 vectors is entirely inside frustum planes
         * @param boundingVectors defines an array of 8 vectors representing a bounding box
         * @param frustumPlanes defines the frustum planes to test
         * @return true if there is an inclusion
         */
        public static IsCompletelyInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean {
            for (var p = 0; p < 6; ++p) {
                const frustumPlane = frustumPlanes[p];
                for (var i = 0; i < 8; ++i) {
                    if (frustumPlane.dotCoordinate(boundingVectors[i]) < 0) {
                        return false;
                    }
                }
            }
            return true;
        }

        /**
         * Tests if a bounding box defined with 8 vectors intersects frustum planes
         * @param boundingVectors defines an array of 8 vectors representing a bounding box
         * @param frustumPlanes defines the frustum planes to test
         * @return true if there is an intersection
         */
        public static IsInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean {
            for (var p = 0; p < 6; ++p) {
                let canReturnFalse = true;
                const frustumPlane = frustumPlanes[p];
                for (var i = 0; i < 8; ++i) {
                    if (frustumPlane.dotCoordinate(boundingVectors[i]) >= 0) {
                        canReturnFalse = false;
                        break;
                    }
                }
                if (canReturnFalse) {
                    return false;
                }
            }
            return true;
        }
    }
}