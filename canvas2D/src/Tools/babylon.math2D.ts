module BABYLON {

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

    export class Tri2DArray {
        constructor(count: number) {
            this._count = count;
            this._array = new Float32Array(9 * count);
        }

        public clear(count: number) {
            if (this._count === count) {
                return;
            }

            this._count = count;
            this._array = new Float32Array(9 * count);
        }

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

        public get count(): number {
            return this._count;
        }

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