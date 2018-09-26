module BABYLON {
    /**
     * Class used to store bounding box information
     */
    export class BoundingBox implements ICullable {
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
         */
        constructor(min: Vector3, max: Vector3) {
            this.reConstruct(min, max);
        }

        /**
         * Gets the 8 vectors representing the bounding box in local space
         */
        public get vectors(): Vector3[] {
            const array = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
            return this.vectorsToRef(array);
        }

        /**
         * Gets the 8 vectors representing the bounding box in world space
         */
        public get vectorsWorld(): Vector3[] {
            const array = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
            return this.vectorsWorldToRef(array);
        }

        /**
         * Gets the 8 vectors representing the bounding box in local space
         * @param array an array of Vector3
         * @returns array containing the vectors
         */
        public vectorsToRef(array: Vector3[]): Vector3[] {
            return this.boudingVectorFromMinMax(array, this.minimum, this.maximum);
        }

        /**
         * Gets the 8 vectors representing the bounding box in world space
         * @param array  an array of Vector3
         * @returns a new array containing the vectors
         */
        public vectorsWorldToRef(array: Vector3[]): Vector3[] {
            return this.boudingVectorFromMinMax(array, this.minimumWorld, this.maximumWorld);
        }

        /**
         * @hidden
         */
        private boudingVectorFromMinMax(array: Vector3[], min: Vector3, max: Vector3): Vector3[] {
            if (array.length < 8)
                array.length = 8;
            array[0].copyFromFloats(min.x, min.y, min.z);
            array[1].copyFromFloats(max.x, max.y, max.z);
            array[2].copyFromFloats(max.x, min.y, min.z);
            array[3].copyFromFloats(min.x, max.y, min.z);
            array[4].copyFromFloats(min.x, min.y, max.z);
            array[5].copyFromFloats(max.x, max.y, min.z);
            array[6].copyFromFloats(min.x, max.y, max.z);
            array[7].copyFromFloats(max.x, min.y, max.z);
            return array
        }

        // Methods

        /**
         * Recreates the entire bounding box from scratch
         * @param min defines the new minimum vector (in local space)
         * @param max defines the new maximum vector (in local space) 
         * @param worldMatrix defines the new world matrix
         */
        public reConstruct(min: Vector3, max: Vector3, worldMatrix?: Matrix) {
            this.minimum.copyFrom(min);
            this.maximum.copyFrom(max);

            // OBB
            this.center.copyFrom(this.maximum).addInPlace(this.minimum).scaleInPlace(0.5);
            this.extendSize.copyFrom(this.maximum).subtractInPlace(this.minimum).scaleInPlace(0.5);
            for (var index = 0; index < 3; index++) {
                this.directions[index].copyFromFloats(0,0,0);
            }

            this.minimumWorld.copyFromFloats(0,0,0);
            this.maximumWorld.copyFromFloats(0,0,0);
            this.centerWorld.copyFromFloats(0,0,0);
            this.extendSizeWorld.copyFromFloats(0,0,0);

            this._update(worldMatrix || this._worldMatrix || Matrix.Identity());
        }

        /**
         * Scale the current bounding box by applying a scale factor
         * @param factor defines the scale factor to apply
         * @returns the current bounding box
         */
        public scale(factor: number): BoundingBox {
            const diff = Tmp.Vector3[0].copyFrom(this.maximum).subtractInPlace(this.minimum);
            let distance = diff.length() * factor;
            diff.normalize();
            let newRadius = diff.scaleInPlace(distance * 0.5);

            const min = Tmp.Vector3[1].copyFrom(this.center).subtractInPlace(newRadius);
            const max = Tmp.Vector3[2].copyFrom(this.center).addInPlace(newRadius);

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
            Vector3.FromFloatsToRef(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this.minimumWorld);
            Vector3.FromFloatsToRef(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this.maximumWorld);

            const vectors = this.vectorsToRef(Tmp.Vector3);
            const v = Tmp.Vector3[8];
            for (var index = 0; index < 8; index++) {
                Vector3.TransformCoordinatesToRef(vectors[index], world, v);
                this.minimumWorld.minimizeInPlace(v);
                this.maximumWorld.maximizeInPlace(v);
            }

            // Extend
            this.maximumWorld.subtractToRef(this.minimumWorld, this.extendSizeWorld);
            this.extendSizeWorld.scaleInPlace(0.5);

            // OBB
            this.maximumWorld.addToRef(this.minimumWorld, this.centerWorld);
            this.centerWorld.scaleInPlace(0.5);

            Vector3.FromFloatArrayToRef(world.m, 0, this.directions[0]);
            Vector3.FromFloatArrayToRef(world.m, 4, this.directions[1]);
            Vector3.FromFloatArrayToRef(world.m, 8, this.directions[2]);

            this._worldMatrix = world;
        }

        /**
         * Tests if the bounding box is intersecting the frustum planes
         * @param frustumPlanes defines the frustum planes to test
         * @returns true if there is an intersection
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return BoundingBox.IsInFrustum(this.vectorsWorldToRef(Tmp.Vector3), frustumPlanes);
        }

        /**
         * Tests if the bounding box is entirely inside the frustum planes
         * @param frustumPlanes defines the frustum planes to test
         * @returns true if there is an inclusion
         */        
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return BoundingBox.IsCompletelyInFrustum(this.vectorsWorldToRef(Tmp.Vector3), frustumPlanes);
        }

        /**
         * Tests if a point is inside the bounding box
         * @param point defines the point to test
         * @returns true if the point is inside the bounding box
         */
        public intersectsPoint(point: Vector3): boolean {
            var delta = -Epsilon;

            if (this.maximumWorld.x - point.x < delta || delta > point.x - this.minimumWorld.x)
                return false;

            if (this.maximumWorld.y - point.y < delta || delta > point.y - this.minimumWorld.y)
                return false;

            if (this.maximumWorld.z - point.z < delta || delta > point.z - this.minimumWorld.z)
                return false;

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
            if (this.maximumWorld.x < min.x || this.minimumWorld.x > max.x)
                return false;

            if (this.maximumWorld.y < min.y || this.minimumWorld.y > max.y)
                return false;

            if (this.maximumWorld.z < min.z || this.minimumWorld.z > max.z)
                return false;

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
            if (box0.maximumWorld.x < box1.minimumWorld.x || box0.minimumWorld.x > box1.maximumWorld.x)
                return false;

            if (box0.maximumWorld.y < box1.minimumWorld.y || box0.minimumWorld.y > box1.maximumWorld.y)
                return false;

            if (box0.maximumWorld.z < box1.minimumWorld.z || box0.minimumWorld.z > box1.maximumWorld.z)
                return false;

            return true;
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
            for (var p = 0; p < 6; p++) {
                for (var i = 0; i < 8; i++) {
                    if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
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
            for (var p = 0; p < 6; p++) {
                var inCount = 8;

                for (var i = 0; i < 8; i++) {
                    if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
                        --inCount;
                    } else {
                        break;
                    }
                }
                if (inCount === 0)
                    return false;
            }
            return true;
        }
    }
}