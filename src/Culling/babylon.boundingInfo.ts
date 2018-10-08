module BABYLON {
    var computeBoxExtents = (axis: Vector3, box: BoundingBox) => {
        var p = Vector3.Dot(box.centerWorld, axis);

        var r0 = Math.abs(Vector3.Dot(box.directions[0], axis)) * box.extendSize.x;
        var r1 = Math.abs(Vector3.Dot(box.directions[1], axis)) * box.extendSize.y;
        var r2 = Math.abs(Vector3.Dot(box.directions[2], axis)) * box.extendSize.z;

        var r = r0 + r1 + r2;
        return {
            min: p - r,
            max: p + r
        };
    };

    var extentsOverlap = (min0: number, max0: number, min1: number, max1: number): boolean => !(min0 > max1 || min1 > max0);

    var axisOverlap = (axis: Vector3, box0: BoundingBox, box1: BoundingBox): boolean => {
        var result0 = computeBoxExtents(axis, box0);
        var result1 = computeBoxExtents(axis, box1);

        return extentsOverlap(result0.min, result0.max, result1.min, result1.max);
    };

    /**
     * Interface for cullable objects
     * @see https://doc.babylonjs.com/babylon101/materials#back-face-culling
     */
    export interface ICullable {
        /**
         * Checks if the object or part of the object is in the frustum
         * @param frustumPlanes Camera near/planes
         * @returns true if the object is in frustum otherwise false
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Checks if a cullable object (mesh...) is in the camera frustum
         * Unlike isInFrustum this cheks the full bounding box
         * @param frustumPlanes Camera near/planes
         * @returns true if the object is in frustum otherwise false
         */
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
    }

    /**
     * Info for a bounding data of a mesh
     */
    export class BoundingInfo implements ICullable {
        /**
         * Bounding box for the mesh
         */
        public boundingBox: BoundingBox;
        /**
         * Bounding sphere for the mesh
         */
        public boundingSphere: BoundingSphere;

        private _isLocked = false;

        /**
         * Constructs bounding info
         * @param minimum min vector of the bounding box/sphere
         * @param maximum max vector of the bounding box/sphere
         * @param worldMatrix defines the new world matrix
         * @param extraWorldExtent an extra extent that will be added in all diretions to the world BoundingInfo only
         */
        constructor(minimum: Vector3, maximum: Vector3, worldMatrix?: Matrix, extraWorldExtent?: number) {
            this.boundingBox = new BoundingBox(minimum, maximum, worldMatrix, extraWorldExtent);
            this.boundingSphere = new BoundingSphere(minimum, maximum, worldMatrix, extraWorldExtent);
        }

        /**
         * Recreates the entire bounding info from scratch, producing same values as if the constructor was called.
         * @param min defines the new minimum vector (in local space)
         * @param max defines the new maximum vector (in local space)
         * @param worldMatrix defines the new world matrix.
         * @param extraWorldExtent an extra extent that will be added in all diretions to the world BoundingInfo only
         */
        public reConstruct(min: Vector3, max: Vector3, worldMatrix?: Matrix, extraWorldExtent?: number) {
            this.boundingBox.reConstruct(min, max, worldMatrix, extraWorldExtent);
            this.boundingSphere.reConstruct(min, max, worldMatrix, extraWorldExtent);
        }

        /**
         * min vector of the bounding box/sphere
         */
        public get minimum(): Vector3 {
            return this.boundingBox.minimum;
        }

        /**
         * max vector of the bounding box/sphere
         */
        public get maximum(): Vector3 {
           return this.boundingBox.maximum;
        }

        /**
         * extra extent added to the world BoundingBox and BoundingSphere
         */
        public get extraWorldExtent(): number | undefined {
            return this.boundingBox.extraWorldExtent;
        }

        /**
         * If the info is locked and won't be updated to avoid perf overhead
         */
        public get isLocked(): boolean {
            return this._isLocked;
        }

        public set isLocked(value: boolean) {
            this._isLocked = value;
        }

        // Methods
        /**
         * Updates the bounding sphere and box
         * @param world world matrix to be used to update
         */
        public update(world: Matrix) {
            if (this._isLocked) {
                return;
            }
            const extraWorldExtent = this.boundingBox.extraWorldExtent;
            this.boundingBox._update(world, extraWorldExtent);
            this.boundingSphere._update(world, extraWorldExtent);
        }

        /**
         * Recreate the bounding info to be centered around a specific point given a specific extend.
         * @param center New center of the bounding info
         * @param extend New extend of the bounding info
         * @returns the current bounding info
         */
        public centerOn(center: Vector3, extend: Vector3): BoundingInfo {

            const minimum = Tmp.Vector3[0].copyFrom(center).subtractInPlace(extend);
            const maximum = Tmp.Vector3[1].copyFrom(center).addInPlace(extend);

            const extraWorldExtent = this.boundingBox.extraWorldExtent;
            this.boundingBox.reConstruct(minimum, maximum, this.boundingBox.getWorldMatrix(), extraWorldExtent);
            this.boundingSphere.reConstruct(minimum, maximum, this.boundingSphere.getWorldMatrix(), extraWorldExtent);

            return this;
        }

        /**
         * Scale the current bounding info by applying a scale factor
         * @param factor defines the scale factor to apply
         * @returns the current bounding info
         */
        public scale(factor: number): BoundingInfo {
            this.boundingBox.scale(factor);
            this.boundingSphere.scale(factor);

            return this;
        }

        /**
         * Returns `true` if the bounding info is within the frustum defined by the passed array of planes.
         * @param frustumPlanes defines the frustum to test
         * @param strategy defines the strategy to use for the culling (default is BABYLON.Scene.CULLINGSTRATEGY_STANDARD)
         * @returns true if the bounding info is in the frustum planes
         */
        public isInFrustum(frustumPlanes: Plane[], strategy: number = AbstractMesh.CULLINGSTRATEGY_STANDARD): boolean {
            if (!this.boundingSphere.isInFrustum(frustumPlanes)) {
                return false;
            }

            if (strategy === AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY) {
                return true;
            }
            return this.boundingBox.isInFrustum(frustumPlanes);
        }

        /**
		 * Gets the world distance between the min and max points of the bounding box
		 */
        public get diagonalLength(): number {
            const boundingBox = this.boundingBox;
            const diag = boundingBox.maximumWorld.subtractToRef(boundingBox.minimumWorld, Tmp.Vector3[0]);
            return diag.length();
        }

        /**
         * Checks if a cullable object (mesh...) is in the camera frustum
         * Unlike isInFrustum this cheks the full bounding box
         * @param frustumPlanes Camera near/planes
         * @returns true if the object is in frustum otherwise false
         */
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return this.boundingBox.isCompletelyInFrustum(frustumPlanes);
        }
        /** @hidden */
        public _checkCollision(collider: Collider): boolean {
            return collider._canDoCollision(this.boundingSphere.centerWorld, this.boundingSphere.radiusWorld, this.boundingBox.minimumWorld, this.boundingBox.maximumWorld);
        }

        /**
         * Checks if a point is inside the bounding box and bounding sphere or the mesh
         * @see https://doc.babylonjs.com/babylon101/intersect_collisions_-_mesh
         * @param point the point to check intersection with
         * @returns if the point intersects
         */
        public intersectsPoint(point: Vector3): boolean {
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
        }

        /**
         * Checks if another bounding info intersects the bounding box and bounding sphere or the mesh
         * @see https://doc.babylonjs.com/babylon101/intersect_collisions_-_mesh
         * @param boundingInfo the bounding info to check intersection with
         * @param precise if the intersection should be done using OBB
         * @returns if the bounding info intersects
         */
        public intersects(boundingInfo: BoundingInfo, precise: boolean): boolean {
            if (!this.boundingSphere.centerWorld || !boundingInfo.boundingSphere.centerWorld) {
                return false;
            }

            if (!BoundingSphere.Intersects(this.boundingSphere, boundingInfo.boundingSphere)) {
                return false;
            }

            if (!BoundingBox.Intersects(this.boundingBox, boundingInfo.boundingBox)) {
                return false;
            }

            if (!precise) {
                return true;
            }

            var box0 = this.boundingBox;
            var box1 = boundingInfo.boundingBox;

            if (!axisOverlap(box0.directions[0], box0, box1)) { return false; }
            if (!axisOverlap(box0.directions[1], box0, box1)) { return false; }
            if (!axisOverlap(box0.directions[2], box0, box1)) { return false; }
            if (!axisOverlap(box1.directions[0], box0, box1)) { return false; }
            if (!axisOverlap(box1.directions[1], box0, box1)) { return false; }
            if (!axisOverlap(box1.directions[2], box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[0]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[1]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[2]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[0]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[1]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[2]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[0]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[1]), box0, box1)) { return false; }
            if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[2]), box0, box1)) { return false; }

            return true;
        }
    }
}