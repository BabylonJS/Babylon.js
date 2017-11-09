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
    }

    var extentsOverlap = (min0: number, max0: number, min1: number, max1: number): boolean => !(min0 > max1 || min1 > max0);

    var axisOverlap = (axis: Vector3, box0: BoundingBox, box1: BoundingBox): boolean => {
        var result0 = computeBoxExtents(axis, box0);
        var result1 = computeBoxExtents(axis, box1);

        return extentsOverlap(result0.min, result0.max, result1.min, result1.max);
    }

    export interface ICullable {
        isInFrustum(frustumPlanes: Plane[]): boolean;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
    }

    export class BoundingInfo implements ICullable {
        public boundingBox: BoundingBox;
        public boundingSphere: BoundingSphere;

        private _isLocked = false;

        constructor(public minimum: Vector3, public maximum: Vector3) {
            this.boundingBox = new BoundingBox(minimum, maximum);
            this.boundingSphere = new BoundingSphere(minimum, maximum);
        }

        public get isLocked(): boolean {
            return this._isLocked;
        }

        public set isLocked(value: boolean) { 
            this._isLocked = value;
        }

        // Methods
        public update(world: Matrix) {
            if (this._isLocked) {
                return;
            }
            this.boundingBox._update(world);
            this.boundingSphere._update(world);
        }

        /**
         * Recreate the bounding info to be centered around a specific point given a specific extend.
         * @param center New center of the bounding info
         * @param extend New extend of the bounding info
         */
        public centerOn(center: Vector3, extend: Vector3): BoundingInfo {
            this.minimum = center.subtract(extend);
            this.maximum = center.add(extend);

            this.boundingBox = new BoundingBox(this.minimum, this.maximum);
            this.boundingSphere = new BoundingSphere(this.minimum, this.maximum);

            return this;
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            if (!this.boundingSphere.isInFrustum(frustumPlanes))
                return false;

            return this.boundingBox.isInFrustum(frustumPlanes);
        }

        /**
		 * Gets the world distance between the min and max points of the bounding box
		 */
		public get diagonalLength(): number {
            let boundingBox = this.boundingBox;
            let size = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld);
		    return size.length();
		}     

        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return this.boundingBox.isCompletelyInFrustum(frustumPlanes);
        }
       
        public _checkCollision(collider: Collider): boolean {
            return collider._canDoCollision(this.boundingSphere.centerWorld, this.boundingSphere.radiusWorld, this.boundingBox.minimumWorld, this.boundingBox.maximumWorld);
        }

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

            if (!axisOverlap(box0.directions[0], box0, box1)) return false;
            if (!axisOverlap(box0.directions[1], box0, box1)) return false;
            if (!axisOverlap(box0.directions[2], box0, box1)) return false;
            if (!axisOverlap(box1.directions[0], box0, box1)) return false;
            if (!axisOverlap(box1.directions[1], box0, box1)) return false;
            if (!axisOverlap(box1.directions[2], box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[0]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[1]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[2]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[0]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[1]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[2]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[0]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[1]), box0, box1)) return false;
            if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[2]), box0, box1)) return false;

            return true;
        }
    }
} 