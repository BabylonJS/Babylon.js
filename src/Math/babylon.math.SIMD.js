var BABYLON;
(function (BABYLON) {
    var SIMDVector3 = (function () {
        function SIMDVector3() {
        }
        SIMDVector3.TransformCoordinatesToRefSIMD = function (vector, transformation, result) {
            var v = SIMD.float32x4.loadXYZ(vector._data, 0);
            var m0 = SIMD.float32x4.load(transformation.m, 0);
            var m1 = SIMD.float32x4.load(transformation.m, 4);
            var m2 = SIMD.float32x4.load(transformation.m, 8);
            var m3 = SIMD.float32x4.load(transformation.m, 12);
            var r = SIMD.float32x4.add(SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(v, 0, 0, 0, 0), m0), SIMD.float32x4.mul(SIMD.float32x4.swizzle(v, 1, 1, 1, 1), m1)), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(v, 2, 2, 2, 2), m2), m3));
            r = SIMD.float32x4.div(r, SIMD.float32x4.swizzle(r, 3, 3, 3, 3));
            SIMD.float32x4.storeXYZ(result._data, 0, r);
        };
        SIMDVector3.TransformCoordinatesFromFloatsToRefSIMD = function (x, y, z, transformation, result) {
            var v0 = SIMD.float32x4.splat(x);
            var v1 = SIMD.float32x4.splat(y);
            var v2 = SIMD.float32x4.splat(z);
            var m0 = SIMD.float32x4.load(transformation.m, 0);
            var m1 = SIMD.float32x4.load(transformation.m, 4);
            var m2 = SIMD.float32x4.load(transformation.m, 8);
            var m3 = SIMD.float32x4.load(transformation.m, 12);
            var r = SIMD.float32x4.add(SIMD.float32x4.add(SIMD.float32x4.mul(v0, m0), SIMD.float32x4.mul(v1, m1)), SIMD.float32x4.add(SIMD.float32x4.mul(v2, m2), m3));
            r = SIMD.float32x4.div(r, SIMD.float32x4.swizzle(r, 3, 3, 3, 3));
            SIMD.float32x4.storeXYZ(result._data, 0, r);
        };
        return SIMDVector3;
    })();
    BABYLON.SIMDVector3 = SIMDVector3;
    var SIMDMatrix = (function () {
        function SIMDMatrix() {
        }
        SIMDMatrix.prototype.multiplyToArraySIMD = function (other, result, offset) {
            if (offset === void 0) { offset = 0; }
            var tm = this.m;
            var om = other.m;
            var om0 = SIMD.float32x4.load(om, 0);
            var om1 = SIMD.float32x4.load(om, 4);
            var om2 = SIMD.float32x4.load(om, 8);
            var om3 = SIMD.float32x4.load(om, 12);
            var tm0 = SIMD.float32x4.load(tm, 0);
            SIMD.float32x4.store(result, offset + 0, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm0, 0, 0, 0, 0), om0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm0, 1, 1, 1, 1), om1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm0, 2, 2, 2, 2), om2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm0, 3, 3, 3, 3), om3)))));
            var tm1 = SIMD.float32x4.load(tm, 4);
            SIMD.float32x4.store(result, offset + 4, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm1, 0, 0, 0, 0), om0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm1, 1, 1, 1, 1), om1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm1, 2, 2, 2, 2), om2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm1, 3, 3, 3, 3), om3)))));
            var tm2 = SIMD.float32x4.load(tm, 8);
            SIMD.float32x4.store(result, offset + 8, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm2, 0, 0, 0, 0), om0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm2, 1, 1, 1, 1), om1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm2, 2, 2, 2, 2), om2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm2, 3, 3, 3, 3), om3)))));
            var tm3 = SIMD.float32x4.load(tm, 12);
            SIMD.float32x4.store(result, offset + 12, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm3, 0, 0, 0, 0), om0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm3, 1, 1, 1, 1), om1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm3, 2, 2, 2, 2), om2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(tm3, 3, 3, 3, 3), om3)))));
        };
        SIMDMatrix.prototype.invertToRefSIMD = function (other) {
            var src = this.m;
            var dest = other.m;
            var row0, row1, row2, row3;
            var tmp1;
            var minor0, minor1, minor2, minor3;
            var det;
            // Load the 4 rows
            var src0 = SIMD.float32x4.load(src, 0);
            var src1 = SIMD.float32x4.load(src, 4);
            var src2 = SIMD.float32x4.load(src, 8);
            var src3 = SIMD.float32x4.load(src, 12);
            // Transpose the source matrix.  Sort of.  Not a true transpose operation
            tmp1 = SIMD.float32x4.shuffle(src0, src1, 0, 1, 4, 5);
            row1 = SIMD.float32x4.shuffle(src2, src3, 0, 1, 4, 5);
            row0 = SIMD.float32x4.shuffle(tmp1, row1, 0, 2, 4, 6);
            row1 = SIMD.float32x4.shuffle(row1, tmp1, 1, 3, 5, 7);
            tmp1 = SIMD.float32x4.shuffle(src0, src1, 2, 3, 6, 7);
            row3 = SIMD.float32x4.shuffle(src2, src3, 2, 3, 6, 7);
            row2 = SIMD.float32x4.shuffle(tmp1, row3, 0, 2, 4, 6);
            row3 = SIMD.float32x4.shuffle(row3, tmp1, 1, 3, 5, 7);
            // This is a true transposition, but it will lead to an incorrect result
            //tmp1 = SIMD.float32x4.shuffle(src0, src1, 0, 1, 4, 5);
            //tmp2 = SIMD.float32x4.shuffle(src2, src3, 0, 1, 4, 5);
            //row0  = SIMD.float32x4.shuffle(tmp1, tmp2, 0, 2, 4, 6);
            //row1  = SIMD.float32x4.shuffle(tmp1, tmp2, 1, 3, 5, 7);
            //tmp1 = SIMD.float32x4.shuffle(src0, src1, 2, 3, 6, 7);
            //tmp2 = SIMD.float32x4.shuffle(src2, src3, 2, 3, 6, 7);
            //row2  = SIMD.float32x4.shuffle(tmp1, tmp2, 0, 2, 4, 6);
            //row3  = SIMD.float32x4.shuffle(tmp1, tmp2, 1, 3, 5, 7);
            // ----
            tmp1 = SIMD.float32x4.mul(row2, row3);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor0 = SIMD.float32x4.mul(row1, tmp1);
            minor1 = SIMD.float32x4.mul(row0, tmp1);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.float32x4.sub(SIMD.float32x4.mul(row1, tmp1), minor0);
            minor1 = SIMD.float32x4.sub(SIMD.float32x4.mul(row0, tmp1), minor1);
            minor1 = SIMD.float32x4.swizzle(minor1, 2, 3, 0, 1); // 0x4E = 01001110
            // ----
            tmp1 = SIMD.float32x4.mul(row1, row2);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor0 = SIMD.float32x4.add(SIMD.float32x4.mul(row3, tmp1), minor0);
            minor3 = SIMD.float32x4.mul(row0, tmp1);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.float32x4.sub(minor0, SIMD.float32x4.mul(row3, tmp1));
            minor3 = SIMD.float32x4.sub(SIMD.float32x4.mul(row0, tmp1), minor3);
            minor3 = SIMD.float32x4.swizzle(minor3, 2, 3, 0, 1); // 0x4E = 01001110
            // ----
            tmp1 = SIMD.float32x4.mul(SIMD.float32x4.swizzle(row1, 2, 3, 0, 1), row3); // 0x4E = 01001110
            tmp1 = SIMD.float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            row2 = SIMD.float32x4.swizzle(row2, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.float32x4.add(SIMD.float32x4.mul(row2, tmp1), minor0);
            minor2 = SIMD.float32x4.mul(row0, tmp1);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor0 = SIMD.float32x4.sub(minor0, SIMD.float32x4.mul(row2, tmp1));
            minor2 = SIMD.float32x4.sub(SIMD.float32x4.mul(row0, tmp1), minor2);
            minor2 = SIMD.float32x4.swizzle(minor2, 2, 3, 0, 1); // 0x4E = 01001110
            // ----
            tmp1 = SIMD.float32x4.mul(row0, row1);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor2 = SIMD.float32x4.add(SIMD.float32x4.mul(row3, tmp1), minor2);
            minor3 = SIMD.float32x4.sub(SIMD.float32x4.mul(row2, tmp1), minor3);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor2 = SIMD.float32x4.sub(SIMD.float32x4.mul(row3, tmp1), minor2);
            minor3 = SIMD.float32x4.sub(minor3, SIMD.float32x4.mul(row2, tmp1));
            // ----
            tmp1 = SIMD.float32x4.mul(row0, row3);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor1 = SIMD.float32x4.sub(minor1, SIMD.float32x4.mul(row2, tmp1));
            minor2 = SIMD.float32x4.add(SIMD.float32x4.mul(row1, tmp1), minor2);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor1 = SIMD.float32x4.add(SIMD.float32x4.mul(row2, tmp1), minor1);
            minor2 = SIMD.float32x4.sub(minor2, SIMD.float32x4.mul(row1, tmp1));
            // ----
            tmp1 = SIMD.float32x4.mul(row0, row2);
            tmp1 = SIMD.float32x4.swizzle(tmp1, 1, 0, 3, 2); // 0xB1 = 10110001
            minor1 = SIMD.float32x4.add(SIMD.float32x4.mul(row3, tmp1), minor1);
            minor3 = SIMD.float32x4.sub(minor3, SIMD.float32x4.mul(row1, tmp1));
            tmp1 = SIMD.float32x4.swizzle(tmp1, 2, 3, 0, 1); // 0x4E = 01001110
            minor1 = SIMD.float32x4.sub(minor1, SIMD.float32x4.mul(row3, tmp1));
            minor3 = SIMD.float32x4.add(SIMD.float32x4.mul(row1, tmp1), minor3);
            // Compute determinant
            det = SIMD.float32x4.mul(row0, minor0);
            det = SIMD.float32x4.add(SIMD.float32x4.swizzle(det, 2, 3, 0, 1), det); // 0x4E = 01001110
            det = SIMD.float32x4.add(SIMD.float32x4.swizzle(det, 1, 0, 3, 2), det); // 0xB1 = 10110001
            tmp1 = SIMD.float32x4.reciprocalApproximation(det);
            det = SIMD.float32x4.sub(SIMD.float32x4.add(tmp1, tmp1), SIMD.float32x4.mul(det, SIMD.float32x4.mul(tmp1, tmp1)));
            det = SIMD.float32x4.swizzle(det, 0, 0, 0, 0);
            // These shuffles aren't necessary if the faulty transposition is done
            // up at the top of this function.
            //minor0 = SIMD.float32x4.swizzle(minor0, 2, 1, 0, 3);
            //minor1 = SIMD.float32x4.swizzle(minor1, 2, 1, 0, 3);
            //minor2 = SIMD.float32x4.swizzle(minor2, 2, 1, 0, 3);
            //minor3 = SIMD.float32x4.swizzle(minor3, 2, 1, 0, 3);
            // Compute final values by multiplying with 1/det
            minor0 = SIMD.float32x4.mul(det, minor0);
            minor1 = SIMD.float32x4.mul(det, minor1);
            minor2 = SIMD.float32x4.mul(det, minor2);
            minor3 = SIMD.float32x4.mul(det, minor3);
            SIMD.float32x4.store(dest, 0, minor0);
            SIMD.float32x4.store(dest, 4, minor1);
            SIMD.float32x4.store(dest, 8, minor2);
            SIMD.float32x4.store(dest, 12, minor3);
            return this;
        };
        SIMDMatrix.LookAtLHToRefSIMD = function (eyeRef, targetRef, upRef, result) {
            var out = result.m;
            var center = SIMD.float32x4(targetRef.x, targetRef.y, targetRef.z, 0);
            var eye = SIMD.float32x4(eyeRef.x, eyeRef.y, eyeRef.z, 0);
            var up = SIMD.float32x4(upRef.x, upRef.y, upRef.z, 0);
            // cc.kmVec3Subtract(f, pCenter, pEye);
            var f = SIMD.float32x4.sub(center, eye);
            // cc.kmVec3Normalize(f, f);    
            var tmp = SIMD.float32x4.mul(f, f);
            tmp = SIMD.float32x4.add(tmp, SIMD.float32x4.add(SIMD.float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.float32x4.swizzle(tmp, 2, 0, 1, 3)));
            f = SIMD.float32x4.mul(f, SIMD.float32x4.reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Assign(up, pUp);
            // cc.kmVec3Normalize(up, up);
            tmp = SIMD.float32x4.mul(up, up);
            tmp = SIMD.float32x4.add(tmp, SIMD.float32x4.add(SIMD.float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.float32x4.swizzle(tmp, 2, 0, 1, 3)));
            up = SIMD.float32x4.mul(up, SIMD.float32x4.reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Cross(s, f, up);
            var s = SIMD.float32x4.sub(SIMD.float32x4.mul(SIMD.float32x4.swizzle(f, 1, 2, 0, 3), SIMD.float32x4.swizzle(up, 2, 0, 1, 3)), SIMD.float32x4.mul(SIMD.float32x4.swizzle(f, 2, 0, 1, 3), SIMD.float32x4.swizzle(up, 1, 2, 0, 3)));
            // cc.kmVec3Normalize(s, s);
            tmp = SIMD.float32x4.mul(s, s);
            tmp = SIMD.float32x4.add(tmp, SIMD.float32x4.add(SIMD.float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.float32x4.swizzle(tmp, 2, 0, 1, 3)));
            s = SIMD.float32x4.mul(s, SIMD.float32x4.reciprocalSqrtApproximation(tmp));
            // cc.kmVec3Cross(u, s, f);
            var u = SIMD.float32x4.sub(SIMD.float32x4.mul(SIMD.float32x4.swizzle(s, 1, 2, 0, 3), SIMD.float32x4.swizzle(f, 2, 0, 1, 3)), SIMD.float32x4.mul(SIMD.float32x4.swizzle(s, 2, 0, 1, 3), SIMD.float32x4.swizzle(f, 1, 2, 0, 3)));
            // cc.kmVec3Normalize(s, s);
            tmp = SIMD.float32x4.mul(s, s);
            tmp = SIMD.float32x4.add(tmp, SIMD.float32x4.add(SIMD.float32x4.swizzle(tmp, 1, 2, 0, 3), SIMD.float32x4.swizzle(tmp, 2, 0, 1, 3)));
            s = SIMD.float32x4.mul(s, SIMD.float32x4.reciprocalSqrtApproximation(tmp));
            var zero = SIMD.float32x4.splat(0.0);
            s = SIMD.float32x4.neg(s);
            var tmp01 = SIMD.float32x4.shuffle(s, u, 0, 1, 4, 5);
            var tmp23 = SIMD.float32x4.shuffle(f, zero, 0, 1, 4, 5);
            var a0 = SIMD.float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
            var a1 = SIMD.float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
            tmp01 = SIMD.float32x4.shuffle(s, u, 2, 3, 6, 7);
            tmp23 = SIMD.float32x4.shuffle(f, zero, 2, 3, 6, 7);
            var a2 = SIMD.float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
            var a3 = SIMD.float32x4(0.0, 0.0, 0.0, 1.0);
            var b0 = SIMD.float32x4(1.0, 0.0, 0.0, 0.0);
            var b1 = SIMD.float32x4(0.0, 1.0, 0.0, 0.0);
            var b2 = SIMD.float32x4(0.0, 0.0, 1.0, 0.0);
            var b3 = SIMD.float32x4.neg(eye);
            b3 = SIMD.float32x4.withW(b3, 1.0);
            SIMD.float32x4.store(out, 0, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b0, 0, 0, 0, 0), a0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b0, 1, 1, 1, 1), a1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b0, 2, 2, 2, 2), a2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(b0, 3, 3, 3, 3), a3)))));
            SIMD.float32x4.store(out, 4, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b1, 0, 0, 0, 0), a0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b1, 1, 1, 1, 1), a1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b1, 2, 2, 2, 2), a2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(b1, 3, 3, 3, 3), a3)))));
            SIMD.float32x4.store(out, 8, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b2, 0, 0, 0, 0), a0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b2, 1, 1, 1, 1), a1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b2, 2, 2, 2, 2), a2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(b2, 3, 3, 3, 3), a3)))));
            SIMD.float32x4.store(out, 12, SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b3, 0, 0, 0, 0), a0), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b3, 1, 1, 1, 1), a1), SIMD.float32x4.add(SIMD.float32x4.mul(SIMD.float32x4.swizzle(b3, 2, 2, 2, 2), a2), SIMD.float32x4.mul(SIMD.float32x4.swizzle(b3, 3, 3, 3, 3), a3)))));
        };
        return SIMDMatrix;
    })();
    BABYLON.SIMDMatrix = SIMDMatrix;
    var previousMultiplyToArray = BABYLON.Matrix.prototype.multiplyToArray;
    var previousInvertToRef = BABYLON.Matrix.prototype.invertToRef;
    var previousLookAtLHToRef = BABYLON.Matrix.LookAtLHToRef;
    var previousTransformCoordinatesToRef = BABYLON.Vector3.TransformCoordinatesToRef;
    var previousTransformCoordinatesFromFloatsToRef = BABYLON.Vector3.TransformCoordinatesFromFloatsToRef;
    var SIMDHelper = (function () {
        function SIMDHelper() {
        }
        Object.defineProperty(SIMDHelper, "IsEnabled", {
            get: function () {
                return SIMDHelper._isEnabled;
            },
            enumerable: true,
            configurable: true
        });
        SIMDHelper.DisableSIMD = function () {
            // Replace functions
            BABYLON.Matrix.prototype.multiplyToArray = previousMultiplyToArray;
            BABYLON.Matrix.prototype.invertToRef = previousInvertToRef;
            BABYLON.Matrix.LookAtLHToRef = previousLookAtLHToRef;
            BABYLON.Vector3.TransformCoordinatesToRef = previousTransformCoordinatesToRef;
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef = previousTransformCoordinatesFromFloatsToRef;
            SIMDHelper._isEnabled = false;
        };
        SIMDHelper.EnableSIMD = function () {
            if (window.SIMD === undefined) {
                return;
            }
            // Replace functions
            BABYLON.Matrix.prototype.multiplyToArray = SIMDMatrix.prototype.multiplyToArraySIMD;
            BABYLON.Matrix.prototype.invertToRef = SIMDMatrix.prototype.invertToRefSIMD;
            BABYLON.Matrix.LookAtLHToRef = SIMDMatrix.LookAtLHToRefSIMD;
            BABYLON.Vector3.TransformCoordinatesToRef = SIMDVector3.TransformCoordinatesToRefSIMD;
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef = SIMDVector3.TransformCoordinatesFromFloatsToRefSIMD;
            Object.defineProperty(BABYLON.Vector3.prototype, "x", {
                get: function () { return this._data[0]; },
                set: function (value) {
                    if (!this._data) {
                        this._data = new Float32Array(3);
                    }
                    this._data[0] = value;
                }
            });
            Object.defineProperty(BABYLON.Vector3.prototype, "y", {
                get: function () { return this._data[1]; },
                set: function (value) {
                    this._data[1] = value;
                }
            });
            Object.defineProperty(BABYLON.Vector3.prototype, "z", {
                get: function () { return this._data[2]; },
                set: function (value) {
                    this._data[2] = value;
                }
            });
            SIMDHelper._isEnabled = true;
        };
        SIMDHelper._isEnabled = false;
        return SIMDHelper;
    })();
    BABYLON.SIMDHelper = SIMDHelper;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.math.SIMD.js.map