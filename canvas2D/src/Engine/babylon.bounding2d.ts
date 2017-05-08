﻿module BABYLON {

    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    export class BoundingInfo2D {

        /**
         * The coordinate of the center of the bounding info
         */
        public center: Vector2;

        /**
         * The radius of the bounding circle, from the center of the bounded object
         */
        public radius: number;

        /**
         * The extent of the bounding rectangle, from the center of the bounded object.
         * This is an absolute value in both X and Y of the vector which describe the right/top corner of the rectangle, you can easily reconstruct the whole rectangle by negating X &| Y.
         */
        public extent: Vector2;

        constructor() {
            this.radius = 0;
            this.center = Vector2.Zero();
            this.extent = Vector2.Zero();
            this._worldAABBDirty = false;
            this._worldAABBDirtyObservable = null;
            this._worldAABB = Vector4.Zero();
        }

        /**
         * Create a BoundingInfo2D object from a given size
         * @param size the size that will be used to set the extend, radius will be computed from it.
         */
        public static CreateFromSize(size: Size): BoundingInfo2D {
            let r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromSizeToRef(size, r);
            return r;
        }

        /**
         * Create a BoundingInfo2D object from a given radius
         * @param radius the radius to use, the extent will be computed from it.
         */
        public static CreateFromRadius(radius: number): BoundingInfo2D {
            let r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromRadiusToRef(radius, r);
            return r;
        }

        /**
         * Create a BoundingInfo2D object from a list of points.
         * The resulted object will be the smallest bounding area that includes all the given points.
         * @param points an array of points to compute the bounding object from.
         */
        public static CreateFromPoints(points: Vector2[]): BoundingInfo2D {
            let r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromPointsToRef(points, r);

            return r;
        }

        /**
         * Update a BoundingInfo2D object using the given Size as input
         * @param size the bounding data will be computed from this size.
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        public static CreateFromSizeToRef(size: Size, b: BoundingInfo2D) {
            if (!size) {
                size = Size.Zero();
            }
            b.center.x = +size.width / 2;
            b.center.y = +size.height / 2;
            b.extent.x = b.center.x;
            b.extent.y = b.center.y;
            b.radius = b.extent.length();
            b._worldAABBDirty = true;
        }

        /**
         * Update a BoundingInfo2D object using the given radius as input
         * @param radius the bounding data will be computed from this radius
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        public static CreateFromRadiusToRef(radius: number, b: BoundingInfo2D) {
            b.center.x = b.center.y = 0;
            let r = +radius;
            b.extent.x = r;
            b.extent.y = r;
            b.radius = r;
            b._worldAABBDirty = true;
        }

        /**
         * Update a BoundingInfo2D object using the given points array as input
         * @param points the point array to use to update the bounding data
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        public static CreateFromPointsToRef(points: Vector2[], b: BoundingInfo2D) {
            let xmin = Number.MAX_VALUE, ymin = Number.MAX_VALUE, xmax = Number.MIN_VALUE, ymax = Number.MIN_VALUE;
            for (let p of points) {
                xmin = Math.min(p.x, xmin);
                xmax = Math.max(p.x, xmax);
                ymin = Math.min(p.y, ymin);
                ymax = Math.max(p.y, ymax);
            }
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, b);
        }

        /**
         * Update a BoundingInfo2D object using the given min/max values as input
         * @param xmin the smallest x coordinate
         * @param xmax the biggest x coordinate
         * @param ymin the smallest y coordinate
         * @param ymax the buggest y coordinate
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        public static CreateFromMinMaxToRef(xmin: number, xmax: number, ymin: number, ymax: number, b: BoundingInfo2D) {
            let w = xmax - xmin;
            let h = ymax - ymin;
            b.center = new Vector2(xmin + w / 2, ymin + h / 2);
            b.extent = new Vector2(xmax - b.center.x, ymax - b.center.y);
            b.radius = b.extent.length();
            b._worldAABBDirty = true;
        }

        public toString(): string {
            return `Center: ${this.center}, Extent: ${this.extent}, Radius: ${this.radius}`;
        }

        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        public clone(): BoundingInfo2D {
            let r = new BoundingInfo2D();
            r.center = this.center.clone();
            r.radius = this.radius;
            r.extent = this.extent.clone();
            return r;
        }

        public clear() {
            this.center.copyFromFloats(0, 0);
            this.radius = 0;
            this.extent.copyFromFloats(0, 0);
            this._worldAABBDirty = true;
        }

        public copyFrom(src: BoundingInfo2D) {
            this.center.copyFrom(src.center);
            this.radius = src.radius;
            this.extent.copyFrom(src.extent);
            this._worldAABBDirty = true;
        }

        public equals(other: BoundingInfo2D): boolean {
            if (!other) {
                return false;
            }
            return other.center.equals(this.center) && other.extent.equals(this.extent);
        }

        /**
         * return the max extend of the bounding info
         */
        public max(): Vector2 {
            let r = Vector2.Zero();
            this.maxToRef(r);
            return r;
        }

        /**
         * return the min/max extend of the bounding info.
         * x, y, z, w are left, bottom, right and top
         */
        public minMax(): Vector4 {
            let r = Vector4.Zero();
            this.minMaxToRef(r);
            return r;
        }

        /**
         * Update a vector2 with the max extend of the bounding info
         * @param result must be a valid/allocated vector2 that will contain the result of the operation
         */
        public maxToRef(result: Vector2) {
            result.x = this.center.x + this.extent.x;
            result.y = this.center.y + this.extent.y;
        }

        /**
         * Update a vector4 with the min/max extend of the bounding info
         * x, y, z, w are left, bottom, right and top
         * @param result must be a valid/allocated vector4 that will contain the result of the operation
         */
        public minMaxToRef(result: Vector4) {
            result.x = this.center.x - this.extent.x;
            result.y = this.center.y - this.extent.y;
            result.z = this.center.x + this.extent.x;
            result.w = this.center.y + this.extent.y;
        }

        /**
         * Return the size of the boundingInfo rect surface
         */
        public size(): Size {
            let r = Size.Zero();
            this.sizeToRef(r);
            return r;
        }

        /**
         * Stores in the result object the size of the boundingInfo rect surface
         * @param result
         */
        public sizeToRef(result: Size) {
            result.width  = this.extent.x * 2;
            result.height = this.extent.y * 2;
        }

        /**
         * Inflate the boundingInfo with the given vector
         * @param offset the extent will be incremented with offset and the radius will be computed again
         */
        public inflate(offset: Vector2) {
            this.extent.addInPlace(offset);
            this.radius = this.extent.length();
        }

        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        public transform(matrix: Matrix2D): BoundingInfo2D {
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, r);
            return r;
        }

        /**
         * Compute the union of this BoundingInfo2D with a given one, returns a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        public union(other: BoundingInfo2D): BoundingInfo2D {
            var r = new BoundingInfo2D();
            this.unionToRef(other, r);
            return r;
        }

        public worldAABBIntersectionTest(other: BoundingInfo2D): boolean {
            let a = this.worldAABB;
            let b = other.worldAABB;

            return b.z >= a.x && b.x <= a.z && b.w >= a.y && b.y <= a.w;
        }

        private static _transform: Array<Vector2> = new Array<Vector2>(Vector2.Zero(), Vector2.Zero(), Vector2.Zero(), Vector2.Zero());

        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        public transformToRef(matrix: Matrix2D, result: BoundingInfo2D) {
            // Construct a bounding box based on the extent values
            let p = BoundingInfo2D._transform;
            p[0].x = this.center.x + this.extent.x;
            p[0].y = this.center.y + this.extent.y;
            p[1].x = this.center.x + this.extent.x;
            p[1].y = this.center.y - this.extent.y;
            p[2].x = this.center.x - this.extent.x;
            p[2].y = this.center.y - this.extent.y;
            p[3].x = this.center.x - this.extent.x;
            p[3].y = this.center.y + this.extent.y;

            // Transform the four points of the bounding box with the matrix
            for (let i = 0; i < 4; i++) {
                matrix.transformPointToRef(p[i], p[i]);
            }
            BoundingInfo2D.CreateFromPointsToRef(p, result);
        }

        private _updateWorldAABB(worldMatrix: Matrix2D) {
            // Construct a bounding box based on the extent values
            let p = BoundingInfo2D._transform;
            p[0].x = this.center.x + this.extent.x;
            p[0].y = this.center.y + this.extent.y;
            p[1].x = this.center.x + this.extent.x;
            p[1].y = this.center.y - this.extent.y;
            p[2].x = this.center.x - this.extent.x;
            p[2].y = this.center.y - this.extent.y;
            p[3].x = this.center.x - this.extent.x;
            p[3].y = this.center.y + this.extent.y;

            // Transform the four points of the bounding box with the matrix
            for (let i = 0; i < 4; i++) {
                worldMatrix.transformPointToRef(p[i], p[i]);
            }

            this._worldAABB.x = Math.min(Math.min(p[0].x, p[1].x), Math.min(p[2].x, p[3].x));
            this._worldAABB.y = Math.min(Math.min(p[0].y, p[1].y), Math.min(p[2].y, p[3].y));
            this._worldAABB.z = Math.max(Math.max(p[0].x, p[1].x), Math.max(p[2].x, p[3].x));
            this._worldAABB.w = Math.max(Math.max(p[0].y, p[1].y), Math.max(p[2].y, p[3].y));
        }

        public worldMatrixAccess: () => Matrix2D;

        public get worldAABBDirtyObservable(): Observable<BoundingInfo2D> {
            if (!this._worldAABBDirtyObservable) {
                this._worldAABBDirtyObservable = new Observable<BoundingInfo2D>();
            }
            return this._worldAABBDirtyObservable;
        }

        public get isWorldAABBDirty() {
            return this._worldAABBDirty;
        }

        public dirtyWorldAABB() {
            if (this._worldAABBDirty) {
                return;
            }

            this._worldAABBDirty = true;
            if (this._worldAABBDirtyObservable && this._worldAABBDirtyObservable.hasObservers()) {
                this._worldAABBDirtyObservable.notifyObservers(this);
            }
        }

        /**
         * Retrieve the world AABB, the Vector4's data is x=xmin, y=ymin, z=xmax, w=ymax
         */
        public get worldAABB(): Vector4 {
            if (this._worldAABBDirty) {
                if (!this.worldMatrixAccess) {
                    throw new Error("you must set the worldMatrixAccess function first");
                }
                this._updateWorldAABB(this.worldMatrixAccess());
                this._worldAABBDirty = false;
            }
            return this._worldAABB;
        }

        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        public unionToRef(other: BoundingInfo2D, result: BoundingInfo2D) {
            let xmax = Math.max(this.center.x + this.extent.x, other.center.x + other.extent.x);
            let ymax = Math.max(this.center.y + this.extent.y, other.center.y + other.extent.y);
            let xmin = Math.min(this.center.x - this.extent.x, other.center.x - other.extent.x);
            let ymin = Math.min(this.center.y - this.extent.y, other.center.y - other.extent.y);
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, result);
        }

        /**
         * Check if the given point is inside the BoundingInfo.
         * The test is first made on the radius, then inside the rectangle described by the extent
         * @param pickPosition the position to test
         * @return true if the point is inside, false otherwise
         */
        public doesIntersect(pickPosition: Vector2): boolean {
            // is it inside the radius?
            let pickLocal = pickPosition.subtract(this.center);
            if (pickLocal.lengthSquared() <= (this.radius * this.radius)) {
                // is it inside the rectangle?
                return ((Math.abs(pickLocal.x) <= this.extent.x) && (Math.abs(pickLocal.y) <= this.extent.y));
            }
            return false;
        }

        private _worldAABBDirtyObservable: Observable<BoundingInfo2D>;
        private _worldAABBDirty: boolean;
        private _worldAABB: Vector4;
    }
}