module BABYLON {

    /**
       * A class storing a Matrix2D for 2D transformations
       * The stored matrix is a 3*3 Matrix2D
       * I   [0,1]   [mX, mY]   R   [ CosZ, SinZ]  T    [ 0,  0]  S   [Sx,  0]
       * D = [2,3] = [nX, nY]   O = [-SinZ, CosZ]  R =  [ 0,  0]  C = [ 0, Sy]
       * X   [4,5]   [tX, tY]   T   [  0  ,  0  ]  N    [Tx, Ty]  L   [ 0,  0]
       *
       * IDX = index, zero based. ROT = Z axis Rotation. TRN = Translation. SCL = Scale.
       */
    export class Matrix2D {

        public static Zero(): Matrix2D {
            return new Matrix2D();
        }
        
        public static FromValuesToRef(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, result: Matrix2D) {
            result.m[0] = m0;   result.m[1] = m1;
            result.m[2] = m2;   result.m[3] = m3;
            result.m[4] = m4;   result.m[5] = m5;
        }

        public static FromMatrix(source: Matrix): Matrix2D {
            let result = new Matrix2D();
            Matrix2D.FromMatrixToRef(source, result);
            return result;
        }

        public static FromMatrixToRef(source: Matrix, result: Matrix2D) {
            result.m[0] = source.m[0];    result.m[1] = source.m[1];
            result.m[2] = source.m[4];    result.m[3] = source.m[5];
            result.m[4] = source.m[8];    result.m[5] = source.m[9];
        }

        public static Rotation(angle: number): Matrix2D {
            var result = new Matrix2D();

            Matrix2D.RotationToRef(angle, result);

            return result;
        }

        public static RotationToRef(angle: number, result: Matrix2D): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[0] = c;    result.m[1] = s;
            result.m[2] = -s;   result.m[3] = c;
            result.m[4] = 0;    result.m[5] = 0;
        }

        public static Translation(x: number, y: number): Matrix2D {
            var result = new Matrix2D();

            Matrix2D.TranslationToRef(x, y, result);

            return result;
        }

        public static TranslationToRef(x: number, y: number, result: Matrix2D): void {
            result.m[0] = 1;    result.m[1] = 0;
            result.m[2] = 0;    result.m[3] = 1;
            result.m[4] = x;    result.m[5] = y;
        }

        public static Scaling(x: number, y: number): Matrix2D {
            var result = new Matrix2D();

            Matrix2D.ScalingToRef(x, y, result);

            return result;
        }

        public static ScalingToRef(x: number, y: number, result: Matrix2D): void {
            result.m[0] = x;    result.m[1] = 0;
            result.m[2] = 0;    result.m[3] = y;
            result.m[4] = 0;    result.m[5] = 0;
        }

        public m = new Float32Array(6);

        public static Identity(): Matrix2D {
            let res = new Matrix2D();
            Matrix2D.IdentityToRef(res);
            return res;
        }

        public static IdentityToRef(res: Matrix2D) {
            res.m[1] = res.m[2] = res.m[4] = res[5] = 0;
            res.m[0] = res.m[3] = 1;
        }

        public static FromQuaternion(quaternion: Quaternion): Matrix2D {
            let result = new Matrix2D();
            Matrix2D.FromQuaternionToRef(quaternion, result);
            return result;
        }

        public static FromQuaternionToRef(quaternion: Quaternion, result: Matrix2D) {
            var xx = quaternion.x * quaternion.x;
            var yy = quaternion.y * quaternion.y;
            var zz = quaternion.z * quaternion.z;
            var xy = quaternion.x * quaternion.y;
            var zw = quaternion.z * quaternion.w;
            //var zx = quaternion.z * quaternion.x;
            //var yw = quaternion.y * quaternion.w;
            //var yz = quaternion.y * quaternion.z;
            //var xw = quaternion.x * quaternion.w;

            result.m[0] = 1.0 - (2.0 * (yy + zz));
            result.m[1] = 2.0 * (xy + zw);
            //result.m[2] = 2.0 * (zx - yw);
            //result.m[3] = 0;
            result.m[2] = 2.0 * (xy - zw);
            result.m[3] = 1.0 - (2.0 * (zz + xx));
            //result.m[6] = 2.0 * (yz + xw);
            //result.m[7] = 0;
            //result.m[8] = 2.0 * (zx + yw);
            //result.m[9] = 2.0 * (yz - xw);
            //result.m[10] = 1.0 - (2.0 * (yy + xx));
            //result.m[11] = 0;
            //result.m[12] = 0;
            //result.m[13] = 0;
            //result.m[14] = 0;
            //result.m[15] = 1.0;
        }

        public static Compose(scale: Vector2, rotation: number, translation: Vector2): Matrix2D {
            var result = Matrix2D.Scaling(scale.x, scale.y);

            var rotationMatrix = Matrix2D.Rotation(rotation);
            result = result.multiply(rotationMatrix);

            result.setTranslation(translation);

            return result;
        }

        public static Invert(source: Matrix2D): Matrix2D {
            let result = new Matrix2D();
            source.invertToRef(result);
            return result;
        }

        public clone(): Matrix2D {
            let result = new Matrix2D();
            result.copyFrom(this);
            return result;
        }

        public copyFrom(other: Matrix2D) {
            for (let i = 0; i < 6; i++) {
                this.m[i] = other.m[i];
            }
        }

        public getTranslation(): Vector2 {
            return new Vector2(this.m[4], this.m[5]);
        }

        public setTranslation(translation: Vector2) {
            this.m[4] = translation.x;
            this.m[5] = translation.y;
        }

        public determinant(): number {
            return this.m[0] * this.m[3] - this.m[1] * this.m[2];
        }

        public invertToThis() {
            this.invertToRef(this);
        }

        public invert(): Matrix2D {
            let res = new Matrix2D();
            this.invertToRef(res);
            return res;
        }

        // http://mathworld.wolfram.com/MatrixInverse.html
        public invertToRef(res: Matrix2D) {
            let l0 = this.m[0]; let l1 = this.m[1];
            let l2 = this.m[2]; let l3 = this.m[3];
            let l4 = this.m[4]; let l5 = this.m[5];

            let det = this.determinant();
            if (det < (Epsilon * Epsilon)) {
                throw new Error("Can't invert matrix, near null determinant");
            }

            let detDiv = 1 / det;

            let det4 = l2 * l5 - l3 * l4;
            let det5 = l1 * l4 - l0 * l5;

            res.m[0] = l3 * detDiv;     res.m[1] = -l1 * detDiv;
            res.m[2] = -l2 * detDiv;    res.m[3] = l0 * detDiv;
            res.m[4] = det4 * detDiv;   res.m[5] = det5 * detDiv;
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
            let l0 = this.m[0];     let l1 = this.m[1];
            let l2 = this.m[2];     let l3 = this.m[3];
            let l4 = this.m[4];     let l5 = this.m[5];

            let r0 = other.m[0];    let r1 = other.m[1];
            let r2 = other.m[2];    let r3 = other.m[3];
            let r4 = other.m[4];    let r5 = other.m[5];

            result.m[0] = l0 * r0 + l1 * r2;        result.m[1] = l0 * r1 + l1 * r3;
            result.m[2] = l2 * r0 + l3 * r2;        result.m[3] = l2 * r1 + l3 * r3;
            result.m[4] = l4 * r0 + l5 * r2 + r4;   result.m[5] = l4 * r1 + l5 * r3 + r5;
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

        private static _decomp: Matrix2D = new Matrix2D();

        public decompose(scale: Vector2, translation: Vector2): number {
            translation.x = this.m[4];
            translation.y = this.m[5];

            scale.x = Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1]);
            scale.y = Math.sqrt(this.m[2] * this.m[2] + this.m[3] * this.m[3]);

            if (scale.x === 0 || scale.y === 0) {
                return null;
            }

            return Math.atan2(-this.m[2] / scale.y, this.m[0] / scale.x);
        }
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

        public transformInPlace(transform: Matrix2D) {
            transform.transformPointToRef(this.a, this.a);
            transform.transformPointToRef(this.b, this.b);
            transform.transformPointToRef(this.c, this.c);
            //Vector2.TransformToRef(this.a, transform, this.a);
            //Vector2.TransformToRef(this.b, transform, this.b);
            //Vector2.TransformToRef(this.c, transform, this.c);

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
        public transformAndStoreToTri2DInfo(index: number, tri2dInfo: Tri2DInfo, transform: Matrix2D) {
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
        public static doesIntersect(setA: Tri2DArray, setB: Tri2DArray, bToATransform: Matrix2D): boolean {
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