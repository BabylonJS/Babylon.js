var BABYLON;
(function (BABYLON) {
    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    var BoundingInfo2D = (function () {
        function BoundingInfo2D() {
            this.extent = new BABYLON.Size(0, 0);
        }
        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        BoundingInfo2D.prototype.clone = function () {
            var r = new BoundingInfo2D();
            r.radius = this.radius;
            r.extent = this.extent.clone();
            return r;
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
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it everytime.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        BoundingInfo2D.prototype.transformToRef = function (matrix, result) {
            // Extract scale from matrix
            var xs = BABYLON.MathTools.Sign(matrix.m[0] * matrix.m[1] * matrix.m[2] * matrix.m[3]) < 0 ? -1 : 1;
            var ys = BABYLON.MathTools.Sign(matrix.m[4] * matrix.m[5] * matrix.m[6] * matrix.m[7]) < 0 ? -1 : 1;
            var scaleX = xs * Math.sqrt(matrix.m[0] * matrix.m[0] + matrix.m[1] * matrix.m[1] + matrix.m[2] * matrix.m[2]);
            var scaleY = ys * Math.sqrt(matrix.m[4] * matrix.m[4] + matrix.m[5] * matrix.m[5] + matrix.m[6] * matrix.m[6]);
            // Get translation
            var trans = matrix.getTranslation();
            var transLength = trans.length();
            if (transLength < BABYLON.Epsilon) {
                result.radius = this.radius * Math.max(scaleX, scaleY);
            }
            else {
                // Compute the radius vector by applying the transformation matrix manually
                var rx = (trans.x / transLength) * (transLength + this.radius) * scaleX;
                var ry = (trans.y / transLength) * (transLength + this.radius) * scaleY;
                // Store the vector length as the new radius
                result.radius = Math.sqrt(rx * rx + ry * ry);
            }
            // Construct a bounding box based on the extent values
            var p = new Array(4);
            p[0] = new BABYLON.Vector2(this.extent.width, this.extent.height);
            p[1] = new BABYLON.Vector2(this.extent.width, -this.extent.height);
            p[2] = new BABYLON.Vector2(-this.extent.width, -this.extent.height);
            p[3] = new BABYLON.Vector2(-this.extent.width, this.extent.height);
            // Transform the four points of the bounding box with the matrix
            for (var i = 0; i < 4; i++) {
                p[i] = BABYLON.Vector2.Transform(p[i], matrix);
            }
            // Take the first point as reference
            var maxW = Math.abs(p[0].x), maxH = Math.abs(p[0].y);
            // Parse the three others, compare them to the reference and keep the biggest
            for (var i = 1; i < 4; i++) {
                maxW = Math.max(Math.abs(p[i].x), maxW);
                maxH = Math.max(Math.abs(p[i].y), maxH);
            }
            // Store the new extent
            result.extent.width = maxW * scaleX;
            result.extent.height = maxH * scaleY;
        };
        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it everytime.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        BoundingInfo2D.prototype.unionToRef = function (other, result) {
            result.radius = Math.max(this.radius, other.radius);
            result.extent.width = Math.max(this.extent.width, other.extent.width);
            result.extent.height = Math.max(this.extent.height, other.extent.height);
        };
        return BoundingInfo2D;
    }());
    BABYLON.BoundingInfo2D = BoundingInfo2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.bounding2d.js.map