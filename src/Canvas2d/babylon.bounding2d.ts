module BABYLON {

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
        }

        public static CreateFromSize(size: Size): BoundingInfo2D {
            let r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromSizeToRef(size, r);
            return r;
        }

        public static CreateFromRadius(radius: number): BoundingInfo2D {
            let r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromRadiusToRef(radius, r);
            return r;
        }

        public static CreateFromPoints(points: Vector2[]): BoundingInfo2D {
            let r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromPointsToRef(points, r);

            return r;
        }

        public static CreateFromSizeToRef(size: Size, b: BoundingInfo2D) {
            if (!size) {
                size = Size.Zero();
            }
            b.center.x = +size.width / 2;
            b.center.y = +size.height / 2;
            b.extent.x = b.center.x;
            b.extent.y = b.center.y;
            b.radius = b.extent.length();
        }

        public static CreateFromRadiusToRef(radius: number, b: BoundingInfo2D) {
            b.center.x = b.center.y = 0;
            let r = +radius;
            b.extent.x = r;
            b.extent.y = r;
            b.radius = r;
        }

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

        public static CreateFromMinMaxToRef(xmin: number, xmax: number, ymin: number, ymax: number, b: BoundingInfo2D) {
            let w = xmax - xmin;
            let h = ymax - ymin;
            b.center = new Vector2(xmin + w / 2, ymin + h / 2);
            b.extent = new Vector2(xmax - b.center.x, ymax - b.center.y);
            b.radius = b.extent.length();
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

        public max(): Vector2 {
            let r = Vector2.Zero();
            this.maxToRef(r);
            return r;
        }

        public maxToRef(result: Vector2) {
            result.x = this.center.x + this.extent.x;
            result.y = this.center.y + this.extent.y;
        }

        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        public transform(matrix: Matrix): BoundingInfo2D {
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, r);
            return r;
        }

        /**
         * Compute the union of this BoundingInfo2D with a given one, return a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        public union(other: BoundingInfo2D): BoundingInfo2D {
            var r = new BoundingInfo2D();
            this.unionToRef(other, r);
            return r;
        }

        private static _transform: Array<Vector2> = new Array<Vector2>(Vector2.Zero(), Vector2.Zero(), Vector2.Zero(), Vector2.Zero());

        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        public transformToRef(matrix: Matrix, result: BoundingInfo2D) {
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
                Vector2.TransformToRef(p[i], matrix, p[i]);
            }
            BoundingInfo2D.CreateFromPointsToRef(p, result);
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

        doesIntersect(pickPosition: Vector2): boolean {
            // is it inside the radius?
            let pickLocal = pickPosition.subtract(this.center);
            if (pickLocal.lengthSquared() <= (this.radius * this.radius)) {
                // is it inside the rectangle?
                return ((Math.abs(pickLocal.x) <= this.extent.x) && (Math.abs(pickLocal.y) <= this.extent.y));
            }
            return false;
        }
    }
}