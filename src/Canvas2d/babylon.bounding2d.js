var BABYLON;
(function (BABYLON) {
    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    var BoundingInfo2D = (function () {
        function BoundingInfo2D() {
            this.radius = 0;
            this.center = BABYLON.Vector2.Zero();
            this.extent = BABYLON.Vector2.Zero();
        }
        BoundingInfo2D.CreateFromSize = function (size) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromSizeToRef(size, r);
            return r;
        };
        BoundingInfo2D.CreateFromRadius = function (radius) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromRadiusToRef(radius, r);
            return r;
        };
        BoundingInfo2D.CreateFromPoints = function (points) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromPointsToRef(points, r);
            return r;
        };
        BoundingInfo2D.CreateFromSizeToRef = function (size, b) {
            b.center = new BABYLON.Vector2(size.width / 2, size.height / 2);
            b.extent = b.center.clone();
            b.radius = b.extent.length();
        };
        BoundingInfo2D.CreateFromRadiusToRef = function (radius, b) {
            b.center = BABYLON.Vector2.Zero();
            b.extent = new BABYLON.Vector2(radius, radius);
            b.radius = radius;
        };
        BoundingInfo2D.CreateFromPointsToRef = function (points, b) {
            var xmin = Number.MAX_VALUE, ymin = Number.MAX_VALUE, xmax = Number.MIN_VALUE, ymax = Number.MIN_VALUE;
            for (var _i = 0; _i < points.length; _i++) {
                var p = points[_i];
                xmin = Math.min(p.x, xmin);
                xmax = Math.max(p.x, xmax);
                ymin = Math.min(p.y, ymin);
                ymax = Math.max(p.y, ymax);
            }
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, b);
        };
        BoundingInfo2D.CreateFromMinMaxToRef = function (xmin, xmax, ymin, ymax, b) {
            b.center = new BABYLON.Vector2(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2);
            b.extent = new BABYLON.Vector2(xmax - b.center.x, ymax - b.center.y);
            b.radius = b.extent.length();
        };
        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        BoundingInfo2D.prototype.clone = function () {
            var r = new BoundingInfo2D();
            r.center = this.center.clone();
            r.radius = this.radius;
            r.extent = this.extent.clone();
            return r;
        };
        BoundingInfo2D.prototype.max = function () {
            var r = BABYLON.Vector2.Zero();
            this.maxToRef(r);
            return r;
        };
        BoundingInfo2D.prototype.maxToRef = function (result) {
            result.x = this.center.x + this.extent.x;
            result.y = this.center.y + this.extent.y;
        };
        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        BoundingInfo2D.prototype.transform = function (matrix, origin) {
            if (origin === void 0) { origin = null; }
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, origin, r);
            return r;
        };
        /**
         * Compute the union of this BoundingInfo2D with a given one, return a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        BoundingInfo2D.prototype.union = function (other) {
            var r = new BoundingInfo2D();
            this.unionToRef(other, r);
            return r;
        };
        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it everytime.
         * @param origin An optional normalized origin to apply before the transformation. 0;0 is top/left, 0.5;0.5 is center, etc.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        BoundingInfo2D.prototype.transformToRef = function (matrix, origin, result) {
            // Construct a bounding box based on the extent values
            var p = new Array(4);
            p[0] = new BABYLON.Vector2(this.center.x + this.extent.x, this.center.y + this.extent.y);
            p[1] = new BABYLON.Vector2(this.center.x + this.extent.x, this.center.y - this.extent.y);
            p[2] = new BABYLON.Vector2(this.center.x - this.extent.x, this.center.y - this.extent.y);
            p[3] = new BABYLON.Vector2(this.center.x - this.extent.x, this.center.y + this.extent.y);
            //if (origin) {
            //    let off = new Vector2((p[0].x - p[2].x) * origin.x, (p[0].y - p[2].y) * origin.y);
            //    for (let j = 0; j < 4; j++) {
            //        p[j].subtractInPlace(off);
            //    }
            //}
            // Transform the four points of the bounding box with the matrix
            for (var i = 0; i < 4; i++) {
                BABYLON.Vector2.TransformToRef(p[i], matrix, p[i]);
            }
            BoundingInfo2D.CreateFromPointsToRef(p, result);
        };
        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it everytime.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        BoundingInfo2D.prototype.unionToRef = function (other, result) {
            var xmax = Math.max(this.center.x + this.extent.x, other.center.x + other.extent.x);
            var ymax = Math.max(this.center.y + this.extent.y, other.center.y + other.extent.y);
            var xmin = Math.min(this.center.x - this.extent.x, other.center.x - other.extent.x);
            var ymin = Math.min(this.center.y - this.extent.y, other.center.y - other.extent.y);
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, result);
        };
        return BoundingInfo2D;
    })();
    BABYLON.BoundingInfo2D = BoundingInfo2D;
})(BABYLON || (BABYLON = {}));
