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
        BoundingInfo2D.CreateFromSize = function (size, origin) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromSizeToRef(size, r, origin);
            return r;
        };
        BoundingInfo2D.CreateFromRadius = function (radius, origin) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromRadiusToRef(radius, r, origin);
            return r;
        };
        BoundingInfo2D.CreateFromPoints = function (points, origin) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromPointsToRef(points, r, origin);
            return r;
        };
        BoundingInfo2D.CreateFromSizeToRef = function (size, b, origin) {
            b.center = new BABYLON.Vector2(size.width / 2, size.height / 2);
            b.extent = b.center.clone();
            if (origin) {
                b.center.x -= size.width * origin.x;
                b.center.y -= size.height * origin.y;
            }
            b.radius = b.extent.length();
        };
        BoundingInfo2D.CreateFromRadiusToRef = function (radius, b, origin) {
            b.center = BABYLON.Vector2.Zero();
            if (origin) {
                b.center.x -= radius * origin.x;
                b.center.y -= radius * origin.y;
            }
            b.extent = new BABYLON.Vector2(radius, radius);
            b.radius = radius;
        };
        BoundingInfo2D.CreateFromPointsToRef = function (points, b, origin) {
            var xmin = Number.MAX_VALUE, ymin = Number.MAX_VALUE, xmax = Number.MIN_VALUE, ymax = Number.MIN_VALUE;
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var p = points_1[_i];
                xmin = Math.min(p.x, xmin);
                xmax = Math.max(p.x, xmax);
                ymin = Math.min(p.y, ymin);
                ymax = Math.max(p.y, ymax);
            }
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, b, origin);
        };
        BoundingInfo2D.CreateFromMinMaxToRef = function (xmin, xmax, ymin, ymax, b, origin) {
            var w = xmax - xmin;
            var h = ymax - ymin;
            b.center = new BABYLON.Vector2(xmin + w / 2, ymin + h / 2);
            if (origin) {
                b.center.x -= w * origin.x;
                b.center.y -= h * origin.y;
            }
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
        BoundingInfo2D.prototype.transform = function (matrix) {
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, r);
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
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        BoundingInfo2D.prototype.transformToRef = function (matrix, result) {
            // Construct a bounding box based on the extent values
            var p = BoundingInfo2D._transform;
            p[0].x = this.center.x + this.extent.x;
            p[0].y = this.center.y + this.extent.y;
            p[1].x = this.center.x + this.extent.x;
            p[1].y = this.center.y - this.extent.y;
            p[2].x = this.center.x - this.extent.x;
            p[2].y = this.center.y - this.extent.y;
            p[3].x = this.center.x - this.extent.x;
            p[3].y = this.center.y + this.extent.y;
            // Transform the four points of the bounding box with the matrix
            for (var i = 0; i < 4; i++) {
                BABYLON.Vector2.TransformToRef(p[i], matrix, p[i]);
            }
            BoundingInfo2D.CreateFromPointsToRef(p, result);
        };
        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
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
        BoundingInfo2D.prototype.doesIntersect = function (pickPosition) {
            // is it inside the radius?
            var pickLocal = pickPosition.subtract(this.center);
            if (pickLocal.lengthSquared() <= (this.radius * this.radius)) {
                // is it inside the rectangle?
                return ((Math.abs(pickLocal.x) <= this.extent.x) && (Math.abs(pickLocal.y) <= this.extent.y));
            }
            return false;
        };
        BoundingInfo2D._transform = new Array(BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero());
        return BoundingInfo2D;
    }());
    BABYLON.BoundingInfo2D = BoundingInfo2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.bounding2d.js.map