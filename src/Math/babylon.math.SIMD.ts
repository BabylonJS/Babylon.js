module BABYLON {

    declare var SIMD: SIMD;

    class SIMDVector3 {
        public static TransformCoordinatesToRefSIMD(vector: Vector3, transformation: Matrix, result: Vector3): void {
            SIMDVector3.TransformCoordinatesFromFloatsToRefSIMD(vector.x, vector.y, vector.z, transformation, result);
        }

        public static TransformCoordinatesFromFloatsToRefSIMD(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            var m = transformation.m;

            var m0 = SIMD.Float32x4.load(m, 0);
            var m1 = SIMD.Float32x4.load(m, 4);
            var m2 = SIMD.Float32x4.load(m, 8);
            var m3 = SIMD.Float32x4.load(m, 12);
            var r = SIMD.Float32x4.add(
                SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.splat(x), m0), SIMD.Float32x4.mul(SIMD.Float32x4.splat(y), m1)),
                SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.splat(z), m2), m3)
            );
            r = SIMD.Float32x4.div(r, SIMD.Float32x4.swizzle(r, 3, 3, 3, 3));
            result.x = SIMD.Float32x4.extractLane(r, 0);
            result.y = SIMD.Float32x4.extractLane(r, 1);
            result.z = SIMD.Float32x4.extractLane(r, 2);
        }
    }

    class SIMDMatrix {
        public multiplyToArraySIMD(other: Matrix, result: Float32Array, offset: number): Matrix {
            var tm: Float32Array = (<any>this).m;
            var om = other.m;

            var m0 = SIMD.Float32x4.load(om, 0);
            var m1 = SIMD.Float32x4.load(om, 4);
            var m2 = SIMD.Float32x4.load(om, 8);
            var m3 = SIMD.Float32x4.load(om, 12);

            for (var i = 0; i < 16; i += 4) {
                SIMD.Float32x4.store(result, i + offset, SIMD.Float32x4.add(
                    SIMD.Float32x4.mul(SIMD.Float32x4.splat(tm[i]), m0),
                    SIMD.Float32x4.add(
                        SIMD.Float32x4.mul(SIMD.Float32x4.splat(tm[i + 1]), m1),
                        SIMD.Float32x4.add(
                            SIMD.Float32x4.mul(SIMD.Float32x4.splat(tm[i + 2]), m2),
                            SIMD.Float32x4.mul(SIMD.Float32x4.splat(tm[i + 3]), m3)))));
            }

            return (<any>this);
        }

        public invertToRefSIMD(other: Matrix): Matrix {
            var src: Float32Array = (<any>this).m;
            var dest = other.m;

            // Load the 4 rows
            var src0 = SIMD.Float32x4.load(src, 0);
            var src1 = SIMD.Float32x4.load(src, 4);
            var src2 = SIMD.Float32x4.load(src, 8);
            var src3 = SIMD.Float32x4.load(src, 12);

            // Transpose the source matrix.  Sort of.  Not a true transpose operation

            var tmp1 = SIMD.Float32x4.shuffle(src0, src1, 0, 1, 4, 5);
            var row1 = SIMD.Float32x4.shuffle(src2, src3, 0, 1, 4, 5);
            var row0 = SIMD.Float32x4.shuffle(tmp1, row1, 0, 2, 4, 6);
            row1 = SIMD.Float32x4.shuffle(row1, tmp1, 1, 3, 5, 7);

            tmp1 = SIMD.Float32x4.shuffle(src0, src1, 2, 3, 6, 7);
            var row3 = SIMD.Float32x4.shuffle(src2, src3, 2, 3, 6, 7);
            var row2 = SIMD.Float32x4.shuffle(tmp1, row3, 0, 2, 4, 6);
            row3 = SIMD.Float32x4.shuffle(row3, tmp1, 1, 3, 5, 7);

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
            tmp1 = SIMD.Float32x4.mul(row2, row3);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            var minor0 = SIMD.Float32x4.mul(row1, tmp1);
            var minor1 = SIMD.Float32x4.mul(row0, tmp1);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row1, tmp1), minor0);
            minor1 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor1);
            minor1 = SIMD.Float32x4.swizzle(minor1, 2, 3, 0, 1); // 0x4E = 01001110

            // ----
            tmp1 = SIMD.Float32x4.mul(row1, row2);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor0);
            var minor3 = SIMD.Float32x4.mul(row0, tmp1);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row3, tmp1));
            minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor3);
            minor3 = SIMD.Float32x4.swizzle(minor3, 2, 3, 0, 1); // 0x4E = 01001110

            // ----
            tmp1 = SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(row1, 2, 3, 0, 1), row3); // 0x4E = 01001110
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            row2 = SIMD.Float32x4.swizzle(row2, 2, 3, 0, 1);  // 0x4E = 01001110
            minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor0);
            var minor2 = SIMD.Float32x4.mul(row0, tmp1);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row2, tmp1));
            minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor2);
            minor2 = SIMD.Float32x4.swizzle(minor2, 2, 3, 0, 1); // 0x4E = 01001110

            // ----
            tmp1 = SIMD.Float32x4.mul(row0, row1);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor2);
            minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row2, tmp1), minor3);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row3, tmp1), minor2);
            minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row2, tmp1));

            // ----
            tmp1 = SIMD.Float32x4.mul(row0, row3);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row2, tmp1));
            minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor2);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor1);
            minor2 = SIMD.Float32x4.sub(minor2, SIMD.Float32x4.mul(row1, tmp1));

            // ----
            tmp1 = SIMD.Float32x4.mul(row0, row2);
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor1);
            minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row1, tmp1));
            tmp1 = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row3, tmp1));
            minor3 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor3);

            // Compute determinant
            var det = SIMD.Float32x4.mul(row0, minor0);
            det = SIMD.Float32x4.add(SIMD.Float32x4.swizzle(det, 2, 3, 0, 1), det); // 0x4E = 01001110
            det = SIMD.Float32x4.add(SIMD.Float32x4.swizzle(det, 1, 0, 3, 2), det); // 0xB1 = 10110001
            tmp1 = SIMD.Float32x4.reciprocalApproximation(det);
            det = SIMD.Float32x4.sub(SIMD.Float32x4.add(tmp1, tmp1), SIMD.Float32x4.mul(det, SIMD.Float32x4.mul(tmp1, tmp1)));
            det = SIMD.Float32x4.swizzle(det, 0, 0, 0, 0);

            // These shuffles aren't necessary if the faulty transposition is done
            // up at the top of this function.
            //minor0 =SIMD.Float32x4.swizzle(minor0, 2, 1, 0, 3);
            //minor1 =SIMD.Float32x4.swizzle(minor1, 2, 1, 0, 3);
            //minor2 =SIMD.Float32x4.swizzle(minor2, 2, 1, 0, 3);
            //minor3 =SIMD.Float32x4.swizzle(minor3, 2, 1, 0, 3);

            // Compute final values by multiplying with 1/det
            SIMD.Float32x4.store(dest, 0, SIMD.Float32x4.mul(det, minor0));
            SIMD.Float32x4.store(dest, 4, SIMD.Float32x4.mul(det, minor1));
            SIMD.Float32x4.store(dest, 8, minor2 = SIMD.Float32x4.mul(det, minor2));
            SIMD.Float32x4.store(dest, 12, SIMD.Float32x4.mul(det, minor3));

            return (<any>this);
        }

        public static LookAtLHToRefSIMD(eyeRef: Vector3, targetRef: Vector3, upRef: Vector3, result: Matrix): void {
            var out = result.m;
            var center = SIMD.Float32x4(targetRef.x, targetRef.y, targetRef.z, 0.0);
            var eye = SIMD.Float32x4(eyeRef.x, eyeRef.y, eyeRef.z, 0.0);
            var up = SIMD.Float32x4(upRef.x, upRef.y, upRef.z, 0.0);

            // cc.kmVec3Subtract(f, pCenter, pEye);
            var f = SIMD.Float32x4.sub(center, eye);
            // cc.kmVec3Normalize(f, f);    
            var tmp = SIMD.Float32x4.mul(f, f);
            tmp = SIMD.Float32x4.add(tmp, SIMD.Float32x4.add(SIMD.Float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.Float32x4.swizzle(tmp, 2, 0, 1, 3)));
            f = SIMD.Float32x4.mul(f, SIMD.Float32x4.reciprocalSqrtApproximation(tmp));

            // cc.kmVec3Assign(up, pUp);
            // cc.kmVec3Normalize(up, up);
            tmp = SIMD.Float32x4.mul(up, up);
            tmp = SIMD.Float32x4.add(tmp, SIMD.Float32x4.add(SIMD.Float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.Float32x4.swizzle(tmp, 2, 0, 1, 3)));
            up = SIMD.Float32x4.mul(up, SIMD.Float32x4.reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Cross(s, f, up);
            var s = SIMD.Float32x4.sub(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(f, 1, 2, 0, 3), SIMD.Float32x4.swizzle(up, 2, 0, 1, 3)), SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(f, 2, 0, 1, 3), SIMD.Float32x4.swizzle(up, 1, 2, 0, 3)));
            // cc.kmVec3Normalize(s, s);
            tmp = SIMD.Float32x4.mul(s, s);
            tmp = SIMD.Float32x4.add(tmp, SIMD.Float32x4.add(SIMD.Float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.Float32x4.swizzle(tmp, 2, 0, 1, 3)));
            s = SIMD.Float32x4.mul(s, SIMD.Float32x4.reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Cross(u, s, f);
            var u = SIMD.Float32x4.sub(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(s, 1, 2, 0, 3), SIMD.Float32x4.swizzle(f, 2, 0, 1, 3)), SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(s, 2, 0, 1, 3), SIMD.Float32x4.swizzle(f, 1, 2, 0, 3)));
            // cc.kmVec3Normalize(s, s);
            tmp = SIMD.Float32x4.mul(s, s);
            tmp = SIMD.Float32x4.add(tmp, SIMD.Float32x4.add(SIMD.Float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.Float32x4.swizzle(tmp, 2, 0, 1, 3)));
            s = SIMD.Float32x4.mul(s, SIMD.Float32x4.reciprocalSqrtApproximation(tmp));

            var zero = SIMD.Float32x4.splat(0.0);
            s = SIMD.Float32x4.neg(s);
            var tmp01 = SIMD.Float32x4.shuffle(s, u, 0, 1, 4, 5);
            var tmp23 = SIMD.Float32x4.shuffle(f, zero, 0, 1, 4, 5);
            var a0 = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
            var a1 = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
            var a2 = SIMD.Float32x4.shuffle(SIMD.Float32x4.shuffle(s, u, 2, 3, 6, 7), SIMD.Float32x4.shuffle(f, zero, 2, 3, 6, 7), 0, 2, 4, 6);
            var a3 = SIMD.Float32x4(0.0, 0.0, 0.0, 1.0);

            var b = SIMD.Float32x4(1.0, 0.0, 0.0, 0.0);
            SIMD.Float32x4.store(out, 0, SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 0, 0, 0, 0), a0), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 1, 1, 1, 1), a1), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 2, 2, 2, 2), a2), SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 3, 3, 3, 3), a3)))));

            b = SIMD.Float32x4(0.0, 1.0, 0.0, 0.0);
            SIMD.Float32x4.store(out, 4, SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 0, 0, 0, 0), a0), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 1, 1, 1, 1), a1), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 2, 2, 2, 2), a2), SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 3, 3, 3, 3), a3)))));

            b = SIMD.Float32x4(0.0, 0.0, 1.0, 0.0);
            SIMD.Float32x4.store(out, 8, SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 0, 0, 0, 0), a0), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 1, 1, 1, 1), a1), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 2, 2, 2, 2), a2), SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 3, 3, 3, 3), a3)))));

            b = SIMD.Float32x4.replaceLane(SIMD.Float32x4.neg(eye), 3, 1.0);
            SIMD.Float32x4.store(out, 12, SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 0, 0, 0, 0), a0), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 1, 1, 1, 1), a1), SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 2, 2, 2, 2), a2), SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b, 3, 3, 3, 3), a3)))));

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
                self.Math.fround = (array => (x: number) => {
                    return array[0] = x, array[0];
                })(new Float32Array(1));
            }

            if (!self.Math.imul) {
                self.Math.imul = (a, b) => {
                    var ah = (a >>> 16) & 0xffff;
                    var al = a & 0xffff;
                    var bh = (b >>> 16) & 0xffff;
                    var bl = b & 0xffff;
                    // the shift by 0 fixes the sign on the high part
                    // the final |0 converts the unsigned value into a signed value
                    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
                };
            }

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
