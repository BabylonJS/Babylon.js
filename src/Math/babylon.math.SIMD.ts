module BABYLON {

    declare var SIMD: SIMD;
    var f4 = SIMD.Float32x4;
    var load = f4.load;
    var add = f4.add;
    var sub = f4.sub;
    var mul = f4.mul;
    var div = f4.div;
    var swizzle = f4.swizzle;
    var splat = f4.splat;
    var store = f4.store;
    var shuffle = f4.shuffle;
    var extract = f4.extractLane;
    var replaceLane = f4.replaceLane;
    var neg = f4.neg;
    var reciprocalApproximation = f4.reciprocalApproximation;
    var reciprocalSqrtApproximation = f4.reciprocalSqrtApproximation;

    class SIMDVector3 {
        public static TransformCoordinatesToRefSIMD(vector: Vector3, transformation: Matrix, result: Vector3): void {
            SIMDVector3.TransformCoordinatesFromFloatsToRefSIMD(vector.x, vector.y, vector.z, transformation, result)
        }

        public static TransformCoordinatesFromFloatsToRefSIMD(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            var m = transformation.m;

            var m0 = load(m, 0);
            var m1 = load(m, 4);
            var m2 = load(m, 8);
            var m3 = load(m, 12);
            var r = add(
                add(mul(splat(x), m0), mul(splat(y), m1)),
                add(mul(splat(z), m2), m3)
            );
            r = div(r, swizzle(r, 3, 3, 3, 3));
            result.x = extract(r, 0);
            result.y = extract(r, 1);
            result.z = extract(r, 2);
        }
    }

    class SIMDMatrix {
        public multiplyToArraySIMD(other: Matrix, result: Float32Array, offset: number): Matrix {
            var tm: Float32Array = (<any>this).m;
            var om = other.m;

            var m0 = load(om, 0);
            var m1 = load(om, 4);
            var m2 = load(om, 8);
            var m3 = load(om, 12);

            for (var i = 0; i < 16; i += 4) {
                store(result, i + offset, add(
                    mul(splat(tm[i]), m0),
                    add(
                        mul(splat(tm[i+1]), m1),
                        add(
                            mul(splat(tm[i+2]), m2),
                            mul(splat(tm[i+3]), m3)))));
            }

            return (<any>this);
        }

        public invertToRefSIMD(other: Matrix): Matrix {
            var src: Float32Array = (<any>this).m;
            var dest = other.m;

            // Load the 4 rows
            var src0 = load(src, 0);
            var src1 = load(src, 4);
            var src2 = load(src, 8);
            var src3 = load(src, 12);

            // Transpose the source matrix.  Sort of.  Not a true transpose operation

            var tmp1 = shuffle(src0, src1, 0, 1, 4, 5);
            var row1 = shuffle(src2, src3, 0, 1, 4, 5);
            var row0 = shuffle(tmp1, row1, 0, 2, 4, 6);
            row1 = shuffle(row1, tmp1, 1, 3, 5, 7);

            tmp1 = shuffle(src0, src1, 2, 3, 6, 7);
            var row3 = shuffle(src2, src3, 2, 3, 6, 7);
            var row2 = shuffle(tmp1, row3, 0, 2, 4, 6);
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
            var minor0 = mul(row1, tmp1);
            var minor1 = mul(row0, tmp1);
            tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = sub(mul(row1, tmp1), minor0);
            minor1 = sub(mul(row0, tmp1), minor1);
            minor1 = swizzle(minor1, 2, 3, 0, 1); // 0x4E = 01001110

            // ----
            tmp1 = mul(row1, row2);
            tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor0 = add(mul(row3, tmp1), minor0);
            var minor3 = mul(row0, tmp1);
            tmp1 = swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = sub(minor0, mul(row3, tmp1));
            minor3 = sub(mul(row0, tmp1), minor3);
            minor3 = swizzle(minor3, 2, 3, 0, 1); // 0x4E = 01001110

            // ----
            tmp1 = mul(swizzle(row1, 2, 3, 0, 1), row3); // 0x4E = 01001110
            tmp1 = swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            row2 = swizzle(row2, 2, 3, 0, 1);  // 0x4E = 01001110
            minor0 = add(mul(row2, tmp1), minor0);
            var minor2 = mul(row0, tmp1);
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
            var det = mul(row0, minor0);
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
            store(dest, 0, mul(det, minor0));
            store(dest, 4, mul(det, minor1));
            store(dest, 8, minor2 = mul(det, minor2));
            store(dest, 12, mul(det, minor3));

            return (<any>this);
        }

        public static LookAtLHToRefSIMD(eyeRef: Vector3, targetRef: Vector3, upRef: Vector3, result: Matrix): void {
            var out = result.m;
            var center = f4(targetRef.x, targetRef.y, targetRef.z, 0.0);
            var eye = f4(eyeRef.x, eyeRef.y, eyeRef.z, 0.0);
            var up = f4(upRef.x, upRef.y, upRef.z, 0.0);

            // cc.kmVec3Subtract(f, pCenter, pEye);
            var f = sub(center, eye);
            // cc.kmVec3Normalize(f, f);    
            var tmp = mul(f, f);
            tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
            f = mul(f, reciprocalSqrtApproximation(tmp));

            // cc.kmVec3Assign(up, pUp);
            // cc.kmVec3Normalize(up, up);
            tmp = mul(up, up);
            tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
            up = mul(up, reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Cross(s, f, up);
            var s = sub(mul(swizzle(f, 1, 2, 0, 3), swizzle(up, 2, 0, 1, 3)), mul(swizzle(f, 2, 0, 1, 3), swizzle(up, 1, 2, 0, 3)));
            // cc.kmVec3Normalize(s, s);
            tmp = mul(s, s);
            tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
            s = mul(s, reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Cross(u, s, f);
            var u = sub(mul(swizzle(s, 1, 2, 0, 3), swizzle(f, 2, 0, 1, 3)), mul(swizzle(s, 2, 0, 1, 3), swizzle(f, 1, 2, 0, 3)));
            // cc.kmVec3Normalize(s, s);
            tmp = mul(s, s);
            tmp = add(tmp, add(swizzle(tmp, 1, 2, 0, 3), swizzle(tmp, 2, 0, 1, 3)));
            s = mul(s, reciprocalSqrtApproximation(tmp));

            var zero = splat(0.0);
            s = neg(s);
            var tmp01 = shuffle(s, u, 0, 1, 4, 5);
            var tmp23 = shuffle(f, zero, 0, 1, 4, 5);
            var a0 = shuffle(tmp01, tmp23, 0, 2, 4, 6);
            var a1 = shuffle(tmp01, tmp23, 1, 3, 5, 7);
            var a2 = shuffle(shuffle(s, u, 2, 3, 6, 7), shuffle(f, zero, 2, 3, 6, 7), 0, 2, 4, 6);
            var a3 = f4(0.0, 0.0, 0.0, 1.0);

            var b = f4(1.0, 0.0, 0.0, 0.0);
            store(out, 0, add(mul(swizzle(b, 0, 0, 0, 0), a0), add(mul(swizzle(b, 1, 1, 1, 1), a1), add(mul(swizzle(b, 2, 2, 2, 2), a2), mul(swizzle(b, 3, 3, 3, 3), a3)))));

            b = f4(0.0, 1.0, 0.0, 0.0);
            store(out, 4, add(mul(swizzle(b, 0, 0, 0, 0), a0), add(mul(swizzle(b, 1, 1, 1, 1), a1), add(mul(swizzle(b, 2, 2, 2, 2), a2), mul(swizzle(b, 3, 3, 3, 3), a3)))));

            b = f4(0.0, 0.0, 1.0, 0.0);
            store(out, 8, add(mul(swizzle(b, 0, 0, 0, 0), a0), add(mul(swizzle(b, 1, 1, 1, 1), a1), add(mul(swizzle(b, 2, 2, 2, 2), a2), mul(swizzle(b, 3, 3, 3, 3), a3)))));

            b = replaceLane(neg(eye), 3, 1.0);
            store(out, 12, add(mul(swizzle(b, 0, 0, 0, 0), a0), add(mul(swizzle(b, 1, 1, 1, 1), a1), add(mul(swizzle(b, 2, 2, 2, 2), a2), mul(swizzle(b, 3, 3, 3, 3), a3)))));

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
