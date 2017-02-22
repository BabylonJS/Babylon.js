module BABYLON {

    /**
     * This class stores the data to make 2D transformation using a Translation (tX, tY), a Scale (sX, sY) and a rotation around the Z axis (rZ).
     * You can multiply two Transform2D object to produce the result of their concatenation.
     * You can transform a given Point (a Vector2D instance) with a Transform2D object or with the Invert of the Transform2D object.
     * There no need to compute/store the Invert of a Transform2D as the invertTranform methods are almost as fast as the transform ones.
     * This class is as light as it could be and the transformation operations are pretty optimal.
     */
    export class Transform2D {
        /**
         * A 2D Vector representing the translation to the origin
         */
        public translation: Vector2;

        /**
         * A number (in radian) representing the rotation around the Z axis at the origin
         */
        public rotation: number;

        /**
         * A 2D Vector representing the scale to apply at the origin
         */
        public scale: Vector2;

        constructor() {
            this.translation = Vector2.Zero();
            this.rotation = 0;
            this.scale = new Vector2(1, 1);
        }

        /**
         * Set the Transform2D object with the given values
         * @param translation The translation to set
         * @param rotation The rotation (in radian) to set
         * @param scale The scale to set
         */
        public set(translation: Vector2, rotation: number, scale: Vector2) {
            this.translation.copyFrom(translation);
            this.rotation = rotation;
            this.scale.copyFrom(scale);
        }

        /**
         * Set the Transform2D object from float values
         * @param transX The translation on X axis, nothing is set if not specified
         * @param transY The translation on Y axis, nothing is set if not specified
         * @param rotation The rotation in radian, nothing is set if not specified
         * @param scaleX The scale along the X axis, nothing is set if not specified
         * @param scaleY The scale along the Y axis, nothing is set if not specified
         */
        public setFromFloats(transX?: number, transY?: number, rotation?: number, scaleX?: number, scaleY?: number) {
            if (transX) {
                this.translation.x = transX;
            }

            if (transY) {
                this.translation.y = transY;
            }

            if (rotation) {
                this.rotation = rotation;
            }

            if (scaleX) {
                this.scale.x = scaleX;
            }

            if (scaleY) {
                this.scale.y = scaleY;
            }
        }

        /**
         * Return a copy of the object
         */
        public clone(): Transform2D {
            let res = new Transform2D();
            res.translation.copyFrom(this.translation);
            res.rotation = this.rotation;
            res.scale.copyFrom(this.scale);

            return res;
        }

        /**
         * Convert a given degree angle into its radian equivalent
         * @param angleDegree the number to convert
         */
        public static ToRadian(angleDegree: number): number {
            return angleDegree * Math.PI * 2 / 360;
        }

        /**
         * Create a new instance and returns it
         * @param translation The translation to store, default is (0,0)
         * @param rotation The rotation to store, default is 0
         * @param scale The scale to store, default is (1,1)
         */
        public static Make(translation?: Vector2, rotation?: number, scale?: Vector2): Transform2D {
            let res = new Transform2D();
            if (translation) {
                res.translation.copyFrom(translation);
            }
            if (rotation) {
                res.rotation = rotation;
            }
            if (scale) {
                res.scale.copyFrom(scale);
            }

            return res;
        }

        /**
         * Set the given Transform2D object with the given values
         * @param translation The translation to store, default is (0,0)
         * @param rotation The rotation to store, default is 0
         * @param scale The scale to store, default is (1,1)
         */
        public static MakeToRef(res: Transform2D, translation?: Vector2, rotation?: number, scale?: Vector2) {
            if (translation) {
                res.translation.copyFrom(translation);
            } else {
                res.translation.copyFromFloats(0, 0);
            }
            if (rotation) {
                res.rotation = rotation;
            } else {
                res.rotation = 0;
            }
            if (scale) {
                res.scale.copyFrom(scale);
            } else {
                res.scale.copyFromFloats(1, 1);
            }
        }

        /**
         * Create a Transform2D object from float values
         * @param transX The translation on X axis, 0 per default
         * @param transY The translation on Y axis, 0 per default
         * @param rotation The rotation in radian, 0 per default
         * @param scaleX The scale along the X axis, 1 per default
         * @param scaleY The scale along the Y axis, 1 per default
         */
        public static MakeFromFloats(transX?: number, transY?: number, rotation?: number, scaleX?: number, scaleY?: number): Transform2D {
            let res = new Transform2D();

            if (transX) {
                res.translation.x = transX;
            }

            if (transY) {
                res.translation.y = transY;
            }

            if (rotation) {
                res.rotation = rotation;
            }

            if (scaleX) {
                res.scale.x = scaleX;
            }

            if (scaleY) {
                res.scale.y = scaleY;
            }

            return res;
        }

        /**
         * Set the given Transform2D object with the given float values
         * @param transX The translation on X axis, 0 per default
         * @param transY The translation on Y axis, 0 per default
         * @param rotation The rotation in radian, 0 per default
         * @param scaleX The scale along the X axis, 1 per default
         * @param scaleY The scale along the Y axis, 1 per default
         */
        public static MakeFromFloatsToRef(res: Transform2D, transX?: number, transY?: number, rotation?: number, scaleX?: number, scaleY?: number) {
            res.translation.x = (transX!=null)   ? transX   : 0;
            res.translation.y = (transY!=null)   ? transY   : 0;
            res.rotation      = (rotation!=null) ? rotation : 0;
            res.scale.x       = (scaleX!=null)   ? scaleX   : 1;
            res.scale.y       = (scaleY!=null)   ? scaleY   : 1;
        }

        /**
         * Create a Transform2D containing only Zeroed values
         */
        public static Zero(): Transform2D {
            let res = new Transform2D();
            res.scale.copyFromFloats(0, 0);
            return res;
        }

        /**
         * Copy the value of the other object into 'this'
         * @param other The other object to copy values from
         */
        public copyFrom(other: Transform2D) {
            this.translation.copyFrom(other.translation);
            this.rotation = other.rotation;
            this.scale.copyFrom(other.scale);
        }

        public toMatrix2D(): Matrix2D {
            let res = new Matrix2D();
            this.toMatrix2DToRef(res);
            return res;
        }

        public toMatrix2DToRef(res: Matrix2D) {
            let tx = this.translation.x;
            let ty = this.translation.y;
            let r = this.rotation;
            let cosr = Math.cos(r);
            let sinr = Math.sin(r);
            let sx = this.scale.x;
            let sy = this.scale.y;

            res.m[0] = cosr * sx;   res.m[1] = sinr * sy;
            res.m[2] = -sinr* sx;   res.m[3] = cosr * sy;
            res.m[4] = tx;          res.m[5] = ty;
        }

        /**
         * In place transformation from a parent matrix.
         * @param parent transform object. "this" will be the result of parent * this
         */
        public multiplyToThis(parent: Transform2D) {
            this.multiplyToRef(parent, this);
        }

        /**
         * Transform this object with a parent and return the result. Result = parent * this
         * @param parent The parent transformation
         */
        public multiply(parent: Transform2D): Transform2D {
            let res = new Transform2D();
            this.multiplyToRef(parent, res);
            return res;
        }

        /**
         * Transform a point and store the result in the very same object
         * @param p Transform this point and change the values with the transformed ones
         */
        public transformPointInPlace(p: Vector2) {
            this.transformPointToRef(p, p);
        }

        /**
         * Transform a point and store the result into a reference object
         * @param p The point to transform
         * @param res Will contain the new transformed coordinates. Can be the object of 'p'.
         */
        public transformPointToRef(p: Vector2, res: Vector2) {
            this.transformFloatsToRef(p.x, p.y, res);
        }

        /**
         * Transform this object with a parent and store the result in reference object
         * @param parent The parent transformation
         * @param result Will contain parent * this. Can be the object of either parent or 'this'
         */
        public multiplyToRef(parent: Transform2D, result: Transform2D) {
            if (!parent || !result) {
                throw new Error("Valid parent and result objects must be specified");
            }
            let tx = this.translation.x;
            let ty = this.translation.y;
            let ptx = parent.translation.x;
            let pty = parent.translation.y;
            let pr = parent.rotation;
            let psx = parent.scale.x;
            let psy = parent.scale.y;
            let cosr = Math.cos(pr);
            let sinr = Math.sin(pr);
            result.translation.x = (((tx * cosr) - (ty * sinr)) * psx) + ptx;
            result.translation.y = (((tx * sinr) + (ty * cosr)) * psy) + pty;
            this.scale.multiplyToRef(parent.scale, result.scale);
            result.rotation = this.rotation;
        }

        /**
         * Transform the given coordinates and store the result in a Vector2 object
         * @param x The X coordinate to transform
         * @param y The Y coordinate to transform
         * @param res The Vector2 object that will contain the result of the transformation
         */
        public transformFloatsToRef(x: number, y: number, res: Vector2) {
            let tx = this.translation.x;
            let ty = this.translation.y;
            let pr = this.rotation;
            let sx = this.scale.x;
            let sy = this.scale.y;
            let cosr = Math.cos(pr);
            let sinr = Math.sin(pr);
            res.x = (((x * cosr) - (y * sinr)) * sx) + tx;
            res.y = (((x * sinr) + (y * cosr)) * sy) + ty;
        }

        /**
         * Invert transform the given coordinates and store the result in a reference object. res = invert(this) * (x,y)
         * @param p Transform this point and change the values with the transformed ones
         * @param res Will contain the result of the invert transformation.
         */
        public invertTransformFloatsToRef(x: number, y: number, res: Vector2) {
            let px = x - this.translation.x;
            let py = y - this.translation.y;

            let pr = -this.rotation;
            let sx = this.scale.x;
            let sy = this.scale.y;
            let psx = (sx===1) ? 1 : (1/sx);
            let psy = (sy===1) ? 1 : (1/sy);
            let cosr = Math.cos(pr);
            let sinr = Math.sin(pr);
            res.x = (((px * cosr) - (py * sinr)) * psx);
            res.y = (((px * sinr) + (py * cosr)) * psy);
        }

        /**
         * Transform a point and return the result
         * @param p the point to transform
         */
        public transformPoint(p: Vector2): Vector2 {
            let res = Vector2.Zero();
            this.transformPointToRef(p, res);
            return res;
        }

        /**
         * Transform the given coordinates and return the result in a Vector2 object
         * @param x The X coordinate to transform
         * @param y The Y coordinate to transform
         */
        public transformFloats(x: number, y: number): Vector2 {
            let res = Vector2.Zero();
            this.transformFloatsToRef(x, y, res);
            return res;
        }

        /**
         * Invert transform a given point and store the result in the very same object. p = invert(this) * p
         * @param p Transform this point and change the values with the transformed ones
         */
        public invertTransformPointInPlace(p: Vector2) {
            this.invertTransformPointToRef(p, p);
        }

        /**
         * Invert transform a given point and store the result in a reference object. res = invert(this) * p
         * @param p Transform this point and change the values with the transformed ones
         * @param res Will contain the result of the invert transformation. 'res' can be the same object as 'p'
         */
        public invertTransformPointToRef(p: Vector2, res: Vector2) {
            this.invertTransformFloatsToRef(p.x, p.y, res);
        }

        /**
         * Invert transform a given point and return the result. return = invert(this) * p
         * @param p The Point to transform
         */
        public invertTransformPoint(p: Vector2): Vector2 {
            let res = Vector2.Zero();
            this.invertTransformPointToRef(p, res);
            return res;
        }

        /**
         * Invert transform the given coordinates and return the result. return = invert(this) * (x,y)
         * @param x The X coordinate to transform
         * @param y The Y coordinate to transform
         */
        public invertTransformFloats(x: number, y: number): Vector2 {
            let res = Vector2.Zero();
            this.invertTransformFloatsToRef(x, y, res);
            return res;
        }
    }

    /**
     * A class storing a Matrix for 2D transformations
     * The stored matrix is a 2*3 Matrix
     * I   [0,1]   [mX, mY]   R   [ CosZ, SinZ]  T    [ 0,  0]  S   [Sx,  0]
     * D = [2,3] = [nX, nY]   O = [-SinZ, CosZ]  R =  [ 0,  0]  C = [ 0, Sy]
     * X   [4,5]   [tX, tY]   T   [  0  ,  0  ]  N    [Tx, Ty]  L   [ 0,  0]
     *
     * IDX = index, zero based. ROT = Z axis Rotation. TRN = Translation. SCL = Scale.
     */
    export class Matrix2D {

        public static Identity(): Matrix2D {
            let res = new Matrix2D();
            Matrix2D.IdentityToRef(res);
            return res;
        }

        public static IdentityToRef(res: Matrix2D) {
            res.m[1] = res.m[2] = res.m[4] = res.m[5] = 0;
            res.m[0] = res.m[3] = 1;           
        }

        public copyFrom(other: Matrix2D) {
            for (let i = 0; i < 6; i++) {
                this.m[i] = other.m[i];
            }
        }

        public determinant(): number {
            return (this.m[0] * this.m[3]) - (this.m[1] * this.m[2]);
        }

        public invertToThis() {
            this.invertToRef(this);
        }

        public invert(): Matrix2D {
            let res = new Matrix2D();
            this.invertToRef(res);
            return res;
        }

        public invertToRef(res: Matrix2D) {
            let a00 = this.m[0], a01 = this.m[1],
                a10 = this.m[2], a11 = this.m[3],
                a20 = this.m[4], a21 = this.m[5];

            let det21 = a21 * a10 - a11 * a20;

            let det = (a00 * a11) - (a01 * a10);
            if (det < (Epsilon*Epsilon)) {
                throw new Error("Can't invert matrix, near null determinant");
            }

            det = 1 / det;

            res.m[0] = a11 * det;
            res.m[1] = -a01 * det;
            res.m[2] = -a10 * det;
            res.m[3] = a00 * det;
            res.m[4] = det21 * det;
            res.m[5] = (-a21 * a00 + a01 * a20) * det;
        }

        public multiplyToThis(other: Matrix2D) {
            this.multiplyToRef(other, this);
        }

        public multiply(other: Matrix2D): Matrix2D {
            let res = new Matrix2D();
            this.multiplyToRef(other, res);
            return res;
        }

        public multiplyToRef(other: Matrix2D, result: Matrix2D) {
            var tm0 = this.m[0];
            var tm1 = this.m[1];
            //var tm2 = this.m[2];
            //var tm3 = this.m[3];
            var tm4 = this.m[2];
            var tm5 = this.m[3];
            //var tm6 = this.m[6];
            //var tm7 = this.m[7];
            var tm8 = this.m[4];
            var tm9 = this.m[5];
            //var tm10 = this.m[10];
            //var tm11 = this.m[11];
            //var tm12 = this.m[12];
            //var tm13 = this.m[13];
            //var tm14 = this.m[14];
            //var tm15 = this.m[15];

            var om0 = other.m[0];
            var om1 = other.m[1];
            //var om2 = other.m[2];
            //var om3 = other.m[3];
            var om4 = other.m[2];
            var om5 = other.m[3];
            //var om6 = other.m[6];
            //var om7 = other.m[7];
            var om8 = other.m[4];
            var om9 = other.m[5];
            //var om10 = other.m[10];
            //var om11 = other.m[11];
            //var om12 = other.m[12];
            //var om13 = other.m[13];
            //var om14 = other.m[14];
            //var om15 = other.m[15];

            result.m[0] = tm0 * om0 + tm1 * om4;
            result.m[1] = tm0 * om1 + tm1 * om5;
            //result.m[2] = tm0 * om2 + tm1 * om6 + tm2 * om10 + tm3 * om14;
            //result.m[3] = tm0 * om3 + tm1 * om7 + tm2 * om11 + tm3 * om15;

            result.m[2] = tm4 * om0 + tm5 * om4;
            result.m[3] = tm4 * om1 + tm5 * om5;
            //result.m[6] = tm4 * om2 + tm5 * om6 + tm6 * om10 + tm7 * om14;
            //result.m[7] = tm4 * om3 + tm5 * om7 + tm6 * om11 + tm7 * om15;

            result.m[4] = tm8 * om0 + tm9 * om4 + om8;
            result.m[5] = tm8 * om1 + tm9 * om5 + om9;
            //result.m[10] = tm8 * om2 + tm9 * om6 + tm10 * om10 + tm11 * om14;
            //result.m[11] = tm8 * om3 + tm9 * om7 + tm10 * om11 + tm11 * om15;

            //result.m[12] = tm12 * om0 + tm13 * om4 + tm14 * om8 + tm15 * om12;
            //result.m[13] = tm12 * om1 + tm13 * om5 + tm14 * om9 + tm15 * om13;
            //result.m[14] = tm12 * om2 + tm13 * om6 + tm14 * om10 + tm15 * om14;
            //result.m[15] = tm12 * om3 + tm13 * om7 + tm14 * om11 + tm15 * om15;
        }

        public transformFloats(x: number, y: number): Vector2 {
            let res = Vector2.Zero();
            this.transformFloatsToRef(x, y, res);
            return res;
        }

        public transformFloatsToRef(x: number, y: number, r: Vector2) {
            r.x = x * this.m[0] + y * this.m[2] + this.m[4];
            r.y = x * this.m[1] + y * this.m[3] + this.m[5];
        }

        public transformPoint(p: Vector2): Vector2 {
            let res = Vector2.Zero();
            this.transformFloatsToRef(p.x, p.y, res);
            return res;
        }

        public transformPointToRef(p: Vector2, r: Vector2) {
            this.transformFloatsToRef(p.x, p.y, r);
        }

        public m = new Float32Array(6);
    }

    /**
     * Stores information about a 2D Triangle.
     * This class stores the 3 vertices but also the center and radius of the triangle
     */
    export class Tri2DInfo {
        /**
         * Construct an instance of Tri2DInfo, you can either pass null to a, b and c and the instance will be allocated "clear", or give actual triangle info and the center/radius will be computed
         */
        constructor(a: Vector2, b: Vector2, c: Vector2) {
            if (a === null && b === null && c === null) {
                this.a = Vector2.Zero();
                this.b = Vector2.Zero();
                this.c = Vector2.Zero();
                this.center = Vector2.Zero();
                this.radius = 0;
                return;
            }

            this.a = a.clone();
            this.b = b.clone();
            this.c = c.clone();

            this._updateCenterRadius();
        }

        a: Vector2;
        b: Vector2;
        c: Vector2;
        center: Vector2;
        radius: number;

        public static Zero() {
            return new Tri2DInfo(null, null, null);
        }

        public set(a: Vector2, b: Vector2, c: Vector2) {
            this.a.copyFrom(a);
            this.b.copyFrom(b);
            this.c.copyFrom(c);

            this._updateCenterRadius();
        }

        public transformInPlace(transform: Matrix) {
            Vector2.TransformToRef(this.a, transform, this.a);
            Vector2.TransformToRef(this.b, transform, this.b);
            Vector2.TransformToRef(this.c, transform, this.c);

            this._updateCenterRadius();
        }

        public doesContain(p: Vector2): boolean {
            return Vector2.PointInTriangle(p, this.a, this.b, this.c);
        }

        private _updateCenterRadius() {
            this.center.x = (this.a.x + this.b.x + this.c.x) / 3;
            this.center.y = (this.a.y + this.b.y + this.c.y) / 3;

            let la = Vector2.DistanceSquared(this.a, this.center);
            let lb = Vector2.DistanceSquared(this.b, this.center);
            let lc = Vector2.DistanceSquared(this.c, this.center);

            let rs = Math.max(Math.max(la, lb), lc);
            this.radius = Math.sqrt(rs);
        }
    }

    /**
     * Stores an array of 2D Triangles.
     * Internally the data is stored as a Float32Array to minimize the memory footprint.
     * This can use the Tri2DInfo class as proxy for storing/retrieving data.
     * The array can't grow, it's fixed size.
     */
    export class Tri2DArray {
        constructor(count: number) {
            this._count = count;
            this._array = new Float32Array(9 * count);
        }

        /**
         * Clear the content and allocate a new array to store the given count of triangles
         * @param count The new count of triangles to store
         */
        public clear(count: number) {
            if (this._count === count) {
                return;
            }

            this._count = count;
            this._array = new Float32Array(9 * count);
        }

        /**
         * Store a given triangle at the given index
         * @param index the 0 based index to store the triangle in the array
         * @param a the A vertex of the triangle
         * @param b the B vertex of the triangle
         * @param c the C vertex of the triangle
         */
        public storeTriangle(index: number, a: Vector2, b: Vector2, c: Vector2) {
            let center = new Vector2((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3);

            let la = Vector2.DistanceSquared(a, center);
            let lb = Vector2.DistanceSquared(b, center);
            let lc = Vector2.DistanceSquared(c, center);

            let rs = Math.max(Math.max(la, lb), lc);
            let radius = Math.sqrt(rs);

            let offset = index * 9;
            this._array[offset + 0] = a.x;
            this._array[offset + 1] = a.y;
            this._array[offset + 2] = b.x;
            this._array[offset + 3] = b.y;
            this._array[offset + 4] = c.x;
            this._array[offset + 5] = c.y;
            this._array[offset + 6] = center.x;
            this._array[offset + 7] = center.y;
            this._array[offset + 8] = radius;
        }

        /**
         * Store a triangle in a Tri2DInfo object
         * @param index the index of the triangle to store
         * @param tri2dInfo the instance that will contain the data, it must be already allocated with its inner object also allocated
         */
        public storeToTri2DInfo(index: number, tri2dInfo: Tri2DInfo) {
            if (index >= this._count) {
                throw new Error(`Can't fetch the triangle at index ${index}, max index is ${this._count - 1}`);
            }

            let offset = index * 9;
            tri2dInfo.a.x      = this._array[offset + 0];
            tri2dInfo.a.y      = this._array[offset + 1];
            tri2dInfo.b.x      = this._array[offset + 2];
            tri2dInfo.b.y      = this._array[offset + 3];
            tri2dInfo.c.x      = this._array[offset + 4];
            tri2dInfo.c.y      = this._array[offset + 5];
            tri2dInfo.center.x = this._array[offset + 6];
            tri2dInfo.center.y = this._array[offset + 7];
            tri2dInfo.radius   = this._array[offset + 8];
        }

        /**
         * Transform the given triangle and store its result in the array
         * @param index The index to store the result to
         * @param tri2dInfo The triangle to transform
         * @param transform The transformation matrix
         */
        public transformAndStoreToTri2DInfo(index: number, tri2dInfo: Tri2DInfo, transform: Matrix) {
            if (index >= this._count) {
                throw new Error(`Can't fetch the triangle at index ${index}, max index is ${this._count - 1}`);
            }

            let offset = index * 9;
            tri2dInfo.a.x = this._array[offset + 0];
            tri2dInfo.a.y = this._array[offset + 1];
            tri2dInfo.b.x = this._array[offset + 2];
            tri2dInfo.b.y = this._array[offset + 3];
            tri2dInfo.c.x = this._array[offset + 4];
            tri2dInfo.c.y = this._array[offset + 5];

            tri2dInfo.transformInPlace(transform);
        }

        /**
         * Get the element count that can be stored in this array
         * @returns {} 
         */
        public get count(): number {
            return this._count;
        }

        /**
         * Check if a given point intersects with at least one of the triangles stored in the array.
         * If true is returned the point is intersecting with at least one triangle, false if it doesn't intersect with any of them
         * @param p The point to check
         */
        public doesContain(p: Vector2): boolean {
            Tri2DArray._checkInitStatics();
            let a = Tri2DArray.tempT[0];

            for (let i = 0; i < this.count; i++) {
                this.storeToTri2DInfo(i, a);
                if (a.doesContain(p)) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Make a intersection test between two sets of triangles. The triangles of setB will be transformed to the frame of reference of the setA using the given bToATransform matrix.
         * If true is returned at least one triangle intersects with another of the other set, otherwise false is returned.
         * @param setA The first set of triangles
         * @param setB The second set of triangles
         * @param bToATransform The transformation matrix to transform the setB triangles into the frame of reference of the setA
         */
        public static doesIntersect(setA: Tri2DArray, setB: Tri2DArray, bToATransform: Matrix): boolean {
            Tri2DArray._checkInitStatics();

            let a = Tri2DArray.tempT[0];
            let b = Tri2DArray.tempT[1];
            let v0 = Tri2DArray.tempV[0];

            for (let curB = 0; curB < setB.count; curB++) {
                setB.transformAndStoreToTri2DInfo(curB, b, bToATransform);

                for (let curA = 0; curA < setA.count; curA++) {
                    setA.storeToTri2DInfo(curA, a);


                    // Fast rejection first
                    v0.x = a.center.x - b.center.x;
                    v0.y = a.center.y - b.center.y;
                    if (v0.lengthSquared() > ((a.radius * a.radius) + (b.radius * b.radius))) {
                        continue;
                    }

                    // Actual intersection test
                    if (Math2D.TriangleTriangleDosIntersect(a.a, a.b, a.c, b.a, b.b, b.c)) {
                        return true;
                    }
                }
            }

            return false;
        }

        private static _checkInitStatics() {
            if (Tri2DArray.tempT !== null) {
                return;
            }

            Tri2DArray.tempT = new Array<Tri2DInfo>(2);
            Tri2DArray.tempT[0] = new Tri2DInfo(null, null, null);
            Tri2DArray.tempT[1] = new Tri2DInfo(null, null, null);

            Tri2DArray.tempV = new Array<Vector2>(6);
            for (let i = 0; i < 6; i++) {
                Tri2DArray.tempV[i] = Vector2.Zero();
            }
        }

        private _count: number;
        private _array: Float32Array;

        private static tempV: Vector2[] = null;
        private static tempT: Tri2DInfo[] = null;
    }

    /**
     * Some 2D Math helpers functions
     */
    class Math2D {

        static Dot(a: Vector2, b: Vector2): number {
            return a.x * b.x + a.y * b.y;
        }

        // From http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        // Note: this one might also be considered with the above one proves to not be good enough: http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
        static LineLineDoesIntersect(segA1: Vector2, segA2: Vector2, segB1: Vector2, segB2: Vector2): boolean {
            let s1_x = segA2.x - segA1.x; let s1_y = segA2.y - segA1.y;
            let s2_x = segB2.x - segB1.x; let s2_y = segB2.y - segB1.y;
            let s = (-s1_y * (segA1.x - segB1.x) + s1_x * (segA1.y - segB1.y)) / (-s2_x * s1_y + s1_x * s2_y);
            let t = ( s2_x * (segA1.y - segB1.y) - s2_y * (segA1.x - segB1.x)) / (-s2_x * s1_y + s1_x * s2_y);

            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                return true;
            }

            return false;
        }

        // From http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        static LineLineIntersection(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2): { res: boolean, xr: number, yr: number } {
            let s1_x = p1.x - p0.x; let s1_y = p1.y - p0.y;
            let s2_x = p3.x - p2.x; let s2_y = p3.y - p2.y;
            let s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
            let t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                return { res: true, xr: p0.x + (t * s1_x), yr: p0.y + (t * s1_y) };
            }

            return { res: false, xr: 0, yr: 0 };
        }

        private static v0 = Vector2.Zero();
        private static v1 = Vector2.Zero();
        private static v2 = Vector2.Zero();

        // Tell me that it's slow and I'll answer: yes it is!
        // If you fancy to implement the SAT (Separating Axis Theorem) version: BE MY VERY WELCOMED GUEST!
        static TriangleTriangleDosIntersect(tri1A: Vector2, tri1B: Vector2, tri1C: Vector2, tri2A: Vector2, tri2B: Vector2, tri2C: Vector2): boolean {
            if (Math2D.LineLineDoesIntersect(tri1A, tri1B, tri2A, tri2B))     return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1B, tri2A, tri2C))     return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1B, tri2B, tri2C))     return true;

            if (Math2D.LineLineDoesIntersect(tri1A, tri1C, tri2A, tri2B))     return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1C, tri2A, tri2C))     return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1C, tri2B, tri2C))     return true;

            if (Math2D.LineLineDoesIntersect(tri1B, tri1C, tri2A, tri2B))     return true;
            if (Math2D.LineLineDoesIntersect(tri1B, tri1C, tri2A, tri2C))     return true;
            if (Math2D.LineLineDoesIntersect(tri1B, tri1C, tri2B, tri2C))     return true;

            if (Vector2.PointInTriangle(tri2A, tri1A, tri1B, tri1C) &&
                Vector2.PointInTriangle(tri2B, tri1A, tri1B, tri1C) &&
                Vector2.PointInTriangle(tri2C, tri1A, tri1B, tri1C))           return true;

            if (Vector2.PointInTriangle(tri1A, tri2A, tri2B, tri2C) &&
                Vector2.PointInTriangle(tri1B, tri2A, tri2B, tri2C) &&
                Vector2.PointInTriangle(tri1C, tri2A, tri2B, tri2C))           return true;

            return false;
        }
    }

}