module BABYLON {
    interface SIMDFuncs {
        TransformCoordinatesSIMD(x: number, y: number, z: number): void;
        multiplyToArraySIMD(): void;
        multiplyResultToArraySIMD(): void;
        invertToRefSIMD(): void;
        LookAtLHToRefSIMD(): void;
    }

    class SIMDMath {
        public static SIMDHeap: Float32Array;
        public static SIMDFuncs: SIMDFuncs;

        private static _initTransformCoordinates(stdlib: SIMDglobal, foreign: any, heap: ArrayBuffer): (x: number, y: number, z: number) => void {
            "use asm";

            var u8Heap = new stdlib.Uint8Array(heap);

            var f4 = stdlib.SIMD.Float32x4;

            var r = f4(0.0, 0.0, 0.0, 0.0);
            var m0 = f4(0.0, 0.0, 0.0, 0.0);
            var m1 = f4(0.0, 0.0, 0.0, 0.0);
            var m2 = f4(0.0, 0.0, 0.0, 0.0);
            var m3 = f4(0.0, 0.0, 0.0, 0.0);

            var fround = stdlib.Math.fround;
            var load = f4.load;
            var add = f4.add;
            var mul = f4.mul;
            var div = f4.div;
            var swizzle = f4.swizzle;
            var splat = f4.splat;
            var store = f4.store;

            function TransformCoordinatesSIMDasm(x: number, y: number, z: number): void {
                x = fround(x);
                y = fround(y);
                z = fround(z);

                m0 = load(u8Heap, 0);
                m1 = load(u8Heap, 16); // 4 * 4
                m2 = load(u8Heap, 32); // 8 * 4
                m3 = load(u8Heap, 48); // 12 * 4
                r = add(
                    add(mul(splat(x), m0), mul(splat(y), m1)),
                    add(mul(splat(z), m2), m3)
                );
                store(u8Heap, 64, div(r, swizzle(r, 3, 3, 3, 3))); // 16 * 4
            }

            return TransformCoordinatesSIMDasm;
        }

        private static _initMultiplyToArray(stdlib: SIMDglobal, foreign: any, heap: ArrayBuffer): { input: () => void, result: () => void } {
            "use asm";

            var u8Heap = new stdlib.Uint8Array(heap);
            var f32Heap = new stdlib.Float32Array(heap);

            var i = 0;
            var f4 = stdlib.SIMD.Float32x4;

            var om0 = f4(0.0, 0.0, 0.0, 0.0);
            var om1 = f4(0.0, 0.0, 0.0, 0.0);
            var om2 = f4(0.0, 0.0, 0.0, 0.0);
            var om3 = f4(0.0, 0.0, 0.0, 0.0);

            var load = f4.load;
            var add = f4.add;
            var mul = f4.mul;
            var splat = f4.splat;
            var store = f4.store;

            function multiplyToArraySIMDasm(): void {
                om0 = load(u8Heap, 0);
                om1 = load(u8Heap, 16); // 4 * 4
                om2 = load(u8Heap, 32); // 4 * 8
                om3 = load(u8Heap, 48); // 4 * 12

                for (i = 0; (i|0) < 64; i = (i + 16)|0) {
                    store(u8Heap, 128 + (i|0), add( // 4 * 32
                        mul(splat(f32Heap[(i + 64)>>2]), om0),
                        add(
                            mul(splat(f32Heap[(i + 68)>>2]), om1),
                            add(
                                mul(splat(f32Heap[(i + 72)>>2]), om2),
                                mul(splat(f32Heap[(i + 76)>>2]), om3)))));
                }
            }

            function multiplyResultToArraySIMDasm(): void {
                om0 = load(u8Heap, 128);
                om1 = load(u8Heap, 144); // 128 + 4 * 4
                om2 = load(u8Heap, 160); // 128 + 4 * 8
                om3 = load(u8Heap, 176); // 128 + 4 * 12

                for (i = 0; (i | 0) < 64; i = (i + 16) | 0) {
                    store(u8Heap, 128 + (i | 0), add( // 4 * 32
                        mul(splat(f32Heap[(i + 64) >> 2]), om0),
                        add(
                            mul(splat(f32Heap[(i + 68) >> 2]), om1),
                            add(
                                mul(splat(f32Heap[(i + 72) >> 2]), om2),
                                mul(splat(f32Heap[(i + 76) >> 2]), om3)))));
                }
            }

            return { input: multiplyToArraySIMDasm, result: multiplyResultToArraySIMDasm };
        }

        private static _initInvertToRef(stdlib: SIMDglobal, foreign: any, heap: ArrayBuffer): () => void {
            "use asm";

            var u8Heap = new stdlib.Uint8Array(heap);

            var f4 = stdlib.SIMD.Float32x4;

            var src0 = f4(0.0, 0.0, 0.0, 0.0);
            var src1 = f4(0.0, 0.0, 0.0, 0.0);
            var src2 = f4(0.0, 0.0, 0.0, 0.0);
            var src3 = f4(0.0, 0.0, 0.0, 0.0);

            var tmp1 = f4(0.0, 0.0, 0.0, 0.0);

            var row0 = f4(0.0, 0.0, 0.0, 0.0);
            var row1 = f4(0.0, 0.0, 0.0, 0.0);
            var row2 = f4(0.0, 0.0, 0.0, 0.0);
            var row3 = f4(0.0, 0.0, 0.0, 0.0);

            var minor0 = f4(0.0, 0.0, 0.0, 0.0);
            var minor1 = f4(0.0, 0.0, 0.0, 0.0);
            var minor2 = f4(0.0, 0.0, 0.0, 0.0);
            var minor3 = f4(0.0, 0.0, 0.0, 0.0);

            var det = f4(0.0, 0.0, 0.0, 0.0);

            var load = f4.load;
            var add = f4.add;
            var sub = f4.sub;
            var mul = f4.mul;
            var swizzle = f4.swizzle;
            var shuffle = f4.shuffle;
            var store = f4.store;
            var reciprocalApproximation = f4.reciprocalApproximation;

            function invertToRefSIMDasm(): void {
                // Load the 4 rows
                src0 = load(u8Heap, 0);
                src1 = load(u8Heap, 16); // 4 * 4
                src2 = load(u8Heap, 32); // 4 * 8
                src3 = load(u8Heap, 48); // 4 * 12

                // Transpose the source matrix.  Sort of.  Not a true transpose operation

                tmp1 = shuffle(src0, src1, 0, 1, 4, 5);
                row1 = shuffle(src2, src3, 0, 1, 4, 5);
                row0 = shuffle(tmp1, row1, 0, 2, 4, 6);
                row1 = shuffle(row1, tmp1, 1, 3, 5, 7);

                tmp1 = shuffle(src0, src1, 2, 3, 6, 7);
                row3 = shuffle(src2, src3, 2, 3, 6, 7);
                row2 = shuffle(tmp1, row3, 0, 2, 4, 6);
                row3 = shuffle(row3, tmp1, 1, 3, 5, 7);

                // This is a true transposition, but it will lead to an incorrect result

                //tmp1 = shuffle(src0, src1, 0, 1, 4, 5);
                //tmp2 = shuffle(src2, src3, 0, 1, 4, 5);
                //row0  = shuffle(tmp1, tmp2, 0, 2, 4, 6);
                //row1  = shuffle(tmp1, tmp2, 1, 3, 5, 7);

                //tmp1 = shuffle(src0, src1, 2, 3, 6, 7);
                //tmp2 = shuffle(src2, src3, 2, 3, 6, 7);
                //row2  = shuffle(tmp1, tmp2, 0, 2, 4, 6);
                //row3  = shuffle(tmp1, tmp2, 1, 3, 5, 7);

                // ----
                tmp1 = mul(row2, row3);
                tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
                minor0 = mul(row1, tmp1);
                minor1 = mul(row0, tmp1);
                tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
                minor0 = sub(mul(row1, tmp1), minor0);
                minor1 = sub(mul(row0, tmp1), minor1);
                minor1 = swizzle(minor1, 2, 3, 0, 1); // 0x4E = 01001110

                // ----
                tmp1 = mul(row1, row2);
                tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
                minor0 = add(mul(row3, tmp1), minor0);
                minor3 = mul(row0, tmp1);
                tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
                minor0 = sub(minor0, mul(row3, tmp1));
                minor3 = sub(mul(row0, tmp1), minor3);
                minor3 = swizzle(minor3, 2, 3, 0, 1); // 0x4E = 01001110

                // ----
                tmp1 = mul(swizzle(row1, 2, 3, 0, 1), row3); // 0x4E = 01001110
                tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
                row2 = swizzle(row2, 2, 3, 0, 1);  // 0x4E = 01001110
                minor0 = add(mul(row2, tmp1), minor0);
                minor2 = mul(row0, tmp1);
                tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
                minor0 = sub(minor0, mul(row2, tmp1));
                minor2 = sub(mul(row0, tmp1), minor2);
                minor2 = swizzle(minor2, 2, 3, 0, 1); // 0x4E = 01001110

                // ----
                tmp1 = mul(row0, row1);
                tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
                minor2 = add(mul(row3, tmp1), minor2);
                minor3 = sub(mul(row2, tmp1), minor3);
                tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
                minor2 = sub(mul(row3, tmp1), minor2);
                minor3 = sub(minor3, mul(row2, tmp1));

                // ----
                tmp1 = mul(row0, row3);
                tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
                minor1 = sub(minor1, mul(row2, tmp1));
                minor2 = add(mul(row1, tmp1), minor2);
                tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
                minor1 = add(mul(row2, tmp1), minor1);
                minor2 = sub(minor2, mul(row1, tmp1));

                // ----
                tmp1 = mul(row0, row2);
                tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
                minor1 = add(mul(row3, tmp1), minor1);
                minor3 = sub(minor3, mul(row1, tmp1));
                tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
                minor1 = sub(minor1, mul(row3, tmp1));
                minor3 = add(mul(row1, tmp1), minor3);

                // Compute determinant
                det = mul(row0, minor0);
                det = add(swizzle(det, 2, 3, 0, 1), det); // 0x4E = 01001110
                det = add(swizzle(det, 1, 0, 3, 2), det); // 0xB1 = 10110001
                tmp1 = reciprocalApproximation(det);
                det = sub(add(tmp1, tmp1), mul(det, mul(tmp1, tmp1)));
                det = swizzle(det, 0, 0, 0, 0);

                // These shuffles aren't necessary if the faulty transposition is done
                // up at the top of this function.
                //minor0 = swizzle(minor0, 2, 1, 0, 3);
                //minor1 = swizzle(minor1, 2, 1, 0, 3);
                //minor2 = swizzle(minor2, 2, 1, 0, 3);
                //minor3 = swizzle(minor3, 2, 1, 0, 3);

                // Compute final values by multiplying with 1/det
                store(u8Heap, 64, mul(det, minor0)); // 4 * 16
                store(u8Heap, 80, mul(det, minor1)); // 4 * 20
                store(u8Heap, 96, mul(det, minor2)); // 4 * 24
                store(u8Heap, 112, mul(det, minor3)); // 4 * 28
            }

            return invertToRefSIMDasm;
        }

        private static _initLookAtLHToRef(stdlib: SIMDglobal, foreign: any, heap: ArrayBuffer): () => void {
            "use asm";

            var u8Heap = new stdlib.Uint8Array(heap);

            var f4 = stdlib.SIMD.Float32x4;

            var center = f4(0.0, 0.0, 0.0, 0.0);
            var eye = f4(0.0, 0.0, 0.0, 0.0);
            var up = f4(0.0, 0.0, 0.0, 0.0);

            var f = f4(0.0, 0.0, 0.0, 0.0);
            var tmp = f4(0.0, 0.0, 0.0, 0.0);
            var s = f4(0.0, 0.0, 0.0, 0.0);
            var u = f4(0.0, 0.0, 0.0, 0.0);

            var zero = f4(0.0, 0.0, 0.0, 0.0);

            var tmp01 = f4(0.0, 0.0, 0.0, 0.0);
            var tmp23 = f4(0.0, 0.0, 0.0, 0.0);
            var a0 = f4(0.0, 0.0, 0.0, 0.0);
            var a1 = f4(0.0, 0.0, 0.0, 0.0);
            var a2 = f4(0.0, 0.0, 0.0, 0.0);
            var a3 = f4(0.0, 0.0, 0.0, 0.0);
            var b0 = f4(0.0, 0.0, 0.0, 0.0);
            var b1 = f4(0.0, 0.0, 0.0, 0.0);
            var b2 = f4(0.0, 0.0, 0.0, 0.0);
            var b3 = f4(0.0, 0.0, 0.0, 0.0);

            var load = f4.load;
            var add = f4.add;
            var sub = f4.sub;
            var mul = f4.mul;
            var swizzle = f4.swizzle;
            var shuffle = f4.shuffle;
            var store = f4.store;
            var reciprocalSqrtApproximation = f4.reciprocalSqrtApproximation;
            var neg = f4.neg;
            var replaceLane = f4.replaceLane;

            function LookAtLHToRefSIMDasm(): void {
                center = load(u8Heap, 0);
                eye = load(u8Heap, 16); // 4 * 4
                up = load(u8Heap, 32); // 4 * 8

                // cc.kmVec3Subtract(f, pCenter, pEye);
                f = sub(center, eye);
                // cc.kmVec3Normalize(f, f);    
                tmp = mul(f, f);
                tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
                f = mul(f, reciprocalSqrtApproximation(tmp));

                // cc.kmVec3Assign(up, pUp);
                // cc.kmVec3Normalize(up, up);
                tmp = mul(up, up);
                tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
                up = mul(up, reciprocalSqrtApproximation(tmp));
                // cc.kmVec3Cross(s, f, up);
                s = sub(
                    mul(
                        swizzle(f, 1, 2, 0, 3),
                        swizzle(up, 2, 0, 1, 3)),
                    mul(
                        swizzle(f, 2, 0, 1, 3),
                        swizzle(up, 1, 2, 0, 3)));
                // cc.kmVec3Normalize(s, s);
                tmp = mul(s, s);
                tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
                s = mul(s, reciprocalSqrtApproximation(tmp));
                // cc.kmVec3Cross(u, s, f);
                u = sub(
                    mul(
                        swizzle(s, 1, 2, 0, 3),
                        swizzle(f, 2, 0, 1, 3)),
                    mul(
                        swizzle(s, 2, 0, 1, 3),
                        swizzle(f, 1, 2, 0, 3)));
                // cc.kmVec3Normalize(s, s);
                tmp = mul(s, s);
                tmp = add(tmp,
                    add(
                        swizzle(tmp, 1, 2, 0, 3),
                        swizzle(tmp, 2, 0, 1, 3)));
                s = mul(s, reciprocalSqrtApproximation(tmp));

                s = neg(s);
                tmp01 = shuffle(s, u, 0, 1, 4, 5);
                tmp23 = shuffle(f, zero, 0, 1, 4, 5);
                a0 = shuffle(tmp01, tmp23, 0, 2, 4, 6);
                a1 = shuffle(tmp01, tmp23, 1, 3, 5, 7);
                tmp01 = shuffle(s, u, 2, 3, 6, 7);
                tmp23 = shuffle(f, zero, 2, 3, 6, 7);
                a2 = shuffle(tmp01, tmp23, 0, 2, 4, 6);
                a3 = f4(0.0, 0.0, 0.0, 1.0);
                b0 = f4(1.0, 0.0, 0.0, 0.0);
                b1 = f4(0.0, 1.0, 0.0, 0.0);
                b2 = f4(0.0, 0.0, 1.0, 0.0);
                b3 = neg(eye);
                b3 = replaceLane(b3, 3, 1.0);

                store(u8Heap, 48, add( // 4 * 12
                    mul(swizzle(b0, 0, 0, 0, 0), a0),
                    add(
                        mul(swizzle(b0, 1, 1, 1, 1), a1),
                        add(
                            mul(swizzle(b0, 2, 2, 2, 2), a2),
                            mul(swizzle(b0, 3, 3, 3, 3), a3)))));
                store(u8Heap, 64, add( // 4 * 16
                    mul(swizzle(b1, 0, 0, 0, 0), a0),
                    add(
                        mul(swizzle(b1, 1, 1, 1, 1), a1),
                        add(
                            mul(swizzle(b1, 2, 2, 2, 2), a2),
                            mul(swizzle(b1, 3, 3, 3, 3), a3)))));
                store(u8Heap, 80, add( // 4 * 20
                    mul(swizzle(b2, 0, 0, 0, 0), a0),
                    add(
                        mul(swizzle(b2, 1, 1, 1, 1), a1),
                        add(
                            mul(swizzle(b2, 2, 2, 2, 2), a2),
                            mul(swizzle(b2, 3, 3, 3, 3), a3)))));
                store(u8Heap, 96, add( // 4 * 24
                    mul(swizzle(b3, 0, 0, 0, 0), a0),
                    add(
                        mul(swizzle(b3, 1, 1, 1, 1), a1),
                        add(
                            mul(swizzle(b3, 2, 2, 2, 2), a2),
                            mul(swizzle(b3, 3, 3, 3, 3), a3)))));
            }

            return LookAtLHToRefSIMDasm;
        }

        public static PrepareSimdFunctions(): void {
            if (this.SIMDFuncs) {
                return;
            }

            if (self.SIMD) {
                this.SIMDHeap = new Float32Array(new ArrayBuffer(0x10000)); // smallest valid heap size
                var empty = {};

                var multiplyArray = this._initMultiplyToArray(self, empty, SIMDMath.SIMDHeap.buffer);

                SIMDMath.SIMDFuncs = {
                    TransformCoordinatesSIMD: this._initTransformCoordinates(self, empty, SIMDMath.SIMDHeap.buffer),
                    multiplyToArraySIMD: multiplyArray.input,
                    multiplyResultToArraySIMD: multiplyArray.result,
                    invertToRefSIMD: this._initInvertToRef(self, empty, SIMDMath.SIMDHeap.buffer),
                    LookAtLHToRefSIMD: this._initLookAtLHToRef(self, empty, SIMDMath.SIMDHeap.buffer)
                };
            }

        }
    }

    class SIMDVector3 {
        public static TransformCoordinatesToRefSIMD(vector: Vector3, transformation: Matrix, result: Vector3): void {
            SIMDVector3.TransformCoordinatesFromFloatsToRefSIMD(vector.x, vector.y, vector.z, transformation, result)
        }

        public static TransformCoordinatesFromFloatsToRefSIMD(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            var heap = SIMDMath.SIMDHeap;
            var m = transformation.m;
            // Float32Array.set is slow, subarray allocs
            heap[0] = m[0];
            heap[1] = m[1];
            heap[2] = m[2];
            heap[3] = m[3];
            heap[4] = m[4];
            heap[5] = m[5];
            heap[6] = m[6];
            heap[7] = m[7];
            heap[8] = m[8];
            heap[9] = m[9];
            heap[10] = m[10];
            heap[11] = m[11];
            heap[12] = m[12];
            heap[13] = m[13];
            heap[14] = m[14];
            heap[15] = m[15];
            SIMDMath.SIMDFuncs.TransformCoordinatesSIMD(x, y, z);
            result.x = heap[16];
            result.y = heap[17];
            result.z = heap[18];
        }
    }

    class SIMDMatrix {
        private static _result: Float32Array;
        public multiplyToArraySIMD(other: Matrix, result: Float32Array, offset: number): Matrix {
            var heap = SIMDMath.SIMDHeap;
            var om = other.m;
            var tm = (<any>this).m;
            // Float32Array.set is slow vs unrolled, subarray allocs
            heap[16] = tm[0];
            heap[17] = tm[1];
            heap[18] = tm[2];
            heap[19] = tm[3];
            heap[20] = tm[4];
            heap[21] = tm[5];
            heap[22] = tm[6];
            heap[23] = tm[7];
            heap[24] = tm[8];
            heap[25] = tm[9];
            heap[26] = tm[10];
            heap[27] = tm[11];
            heap[28] = tm[12];
            heap[29] = tm[13];
            heap[30] = tm[14];
            heap[31] = tm[15];

            if (SIMDMatrix._result !== om) {
                heap[0] = om[0];
                heap[1] = om[1];
                heap[2] = om[2];
                heap[3] = om[3];
                heap[4] = om[4];
                heap[5] = om[5];
                heap[6] = om[6];
                heap[7] = om[7];
                heap[8] = om[8];
                heap[9] = om[9];
                heap[10] = om[10];
                heap[11] = om[11];
                heap[12] = om[12];
                heap[13] = om[13];
                heap[14] = om[14];
                heap[15] = om[15];

                SIMDMath.SIMDFuncs.multiplyToArraySIMD();
            } else {
                SIMDMath.SIMDFuncs.multiplyResultToArraySIMD();
            }

            SIMDMatrix._result = result;
            result[offset] = heap[32];
            result[offset + 1] = heap[33];
            result[offset + 2] = heap[34];
            result[offset + 3] = heap[35];
            result[offset + 4] = heap[36];
            result[offset + 5] = heap[37];
            result[offset + 6] = heap[38];
            result[offset + 7] = heap[39];
            result[offset + 8] = heap[40];
            result[offset + 9] = heap[41];
            result[offset + 10] = heap[42];
            result[offset + 11] = heap[43];
            result[offset + 12] = heap[44];
            result[offset + 13] = heap[45];
            result[offset + 14] = heap[46];
            result[offset + 15] = heap[47];
            return (<any>this);
        }

        public invertToRefSIMD(other: Matrix): Matrix {
            var heap = SIMDMath.SIMDHeap;
            var tm = (<any>this).m;
            var om = other.m;
            // Float32Array.set is slow vs unrolled, subarray allocs
            heap[0] = tm[0];
            heap[1] = tm[1];
            heap[2] = tm[2];
            heap[3] = tm[3];
            heap[4] = tm[4];
            heap[5] = tm[5];
            heap[6] = tm[6];
            heap[7] = tm[7];
            heap[8] = tm[8];
            heap[9] = tm[9];
            heap[10] = tm[10];
            heap[11] = tm[11];
            heap[12] = tm[12];
            heap[13] = tm[13];
            heap[14] = tm[14];
            heap[15] = tm[15];
            SIMDMath.SIMDFuncs.invertToRefSIMD();
            om[0] = heap[16];
            om[1] = heap[17];
            om[2] = heap[18];
            om[3] = heap[19];
            om[4] = heap[20];
            om[5] = heap[21];
            om[6] = heap[22];
            om[7] = heap[23];
            om[8] = heap[24];
            om[9] = heap[25];
            om[10] = heap[26];
            om[11] = heap[27];
            om[12] = heap[28];
            om[13] = heap[29];
            om[14] = heap[30];
            om[15] = heap[31];
            return (<any>this);
        }

        public static LookAtLHToRefSIMD(eyeRef: Vector3, targetRef: Vector3, upRef: Vector3, result: Matrix): void {
            var heap = SIMDMath.SIMDHeap;
            heap[0] = targetRef.x;
            heap[1] = targetRef.y;
            heap[2] = targetRef.z;
            heap[3] = 0;

            heap[4] = eyeRef.x;
            heap[5] = eyeRef.y;
            heap[6] = eyeRef.z;
            heap[7] = 0;

            heap[8] = upRef.x;
            heap[9] = upRef.y;
            heap[10] = upRef.z;
            heap[11] = 0;

            SIMDMath.SIMDFuncs.LookAtLHToRefSIMD();
            // Float32Array.set is slow vs unrolled, subarray allocs
            var r = result.m;
            r[0] = heap[12];
            r[1] = heap[13];
            r[2] = heap[14];
            r[3] = heap[15];
            r[4] = heap[16];
            r[5] = heap[18];
            r[6] = heap[19];
            r[7] = heap[20];
            r[8] = heap[21];
            r[9] = heap[22];
            r[10] = heap[23];
            r[11] = heap[24];
            r[12] = heap[25];
            r[13] = heap[26];
            r[14] = heap[27];
            r[15] = heap[28];
        }
    }

    var previousMultiplyToArray = Matrix.prototype.multiplyToArray;
    var previousInvertToRef = Matrix.prototype.invertToRef;
    var previousLookAtLHToRef = Matrix.LookAtLHToRef;
    var previousTransformCoordinatesToRef = Vector3.TransformCoordinatesToRef;
    var previousTransformCoordinatesFromFloatsToRef = Vector3.TransformCoordinatesFromFloatsToRef;

    export class SIMDHelper {
        private static _isEnabled = false;

        public static get IsEnabled(): boolean {
            return SIMDHelper._isEnabled;
        }

        public static DisableSIMD(): void {
            // Replace functions
            Matrix.prototype.multiplyToArray = previousMultiplyToArray;
            Matrix.prototype.invertToRef = previousInvertToRef;
            Matrix.LookAtLHToRef = previousLookAtLHToRef;
            Vector3.TransformCoordinatesToRef = previousTransformCoordinatesToRef;
            Vector3.TransformCoordinatesFromFloatsToRef = previousTransformCoordinatesFromFloatsToRef;

            SIMDHelper._isEnabled = false;
        }

        public static EnableSIMD(): void {
            if (self.SIMD === undefined) {
                return;
            }

            // check if polyfills needed
            if (!self.Math.fround) {
                self.Math.fround = (function (array) {
                    return function (x) {
                        return array[0] = x, array[0];
                    };
                })(new Float32Array(1));
            }

            if (!self.Math.imul) {
                self.Math.imul = function (a, b) {
                    var ah = (a >>> 16) & 0xffff;
                    var al = a & 0xffff;
                    var bh = (b >>> 16) & 0xffff;
                    var bl = b & 0xffff;
                    // the shift by 0 fixes the sign on the high part
                    // the final |0 converts the unsigned value into a signed value
                    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
                };
            }

            SIMDMath.PrepareSimdFunctions();

            // Replace functions
            Matrix.prototype.multiplyToArray = SIMDMatrix.prototype.multiplyToArraySIMD;
            Matrix.prototype.invertToRef = SIMDMatrix.prototype.invertToRefSIMD;
            Matrix.LookAtLHToRef = SIMDMatrix.LookAtLHToRefSIMD;
            Vector3.TransformCoordinatesToRef = SIMDVector3.TransformCoordinatesToRefSIMD;
            Vector3.TransformCoordinatesFromFloatsToRef = SIMDVector3.TransformCoordinatesFromFloatsToRefSIMD;

            SIMDHelper._isEnabled = true;
        }
    }
}
