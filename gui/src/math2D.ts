/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Vector2WithInfo extends Vector2 {        
        public constructor(source: Vector2, public buttonIndex: number = 0) {
            super(source.x, source.y);
        }
    }

    export class Matrix2D {
        public m = new Float32Array(6);

        constructor(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number) {
            this.fromValues(m00, m01, m10, m11, m20, m21);
        }

        public fromValues(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number): Matrix2D {
            this.m[0] = m00; this.m[1] = m01; 
            this.m[2] = m10; this.m[3] = m11;
            this.m[4] = m20; this.m[5] = m21;
            return this;
        }

        public determinant(): number {
            return this.m[0] * this.m[3] - this.m[1] * this.m[2];
        }

        public invertToRef(result: Matrix2D): Matrix2D {
            let l0 = this.m[0]; let l1 = this.m[1];
            let l2 = this.m[2]; let l3 = this.m[3];
            let l4 = this.m[4]; let l5 = this.m[5];

            let det = this.determinant();
            if (det < (Epsilon * Epsilon)) {
                result.m[0] = 0;     result.m[1] = 0;
                result.m[2] = 0;    result.m[3] = 0;
                result.m[4] = 0;   result.m[5] = 0;
                return this;
            }

            let detDiv = 1 / det;

            let det4 = l2 * l5 - l3 * l4;
            let det5 = l1 * l4 - l0 * l5;

            result.m[0] = l3 * detDiv;     result.m[1] = -l1 * detDiv;
            result.m[2] = -l2 * detDiv;    result.m[3] = l0 * detDiv;
            result.m[4] = det4 * detDiv;   result.m[5] = det5 * detDiv;

            return this;
        }

        public multiplyToRef(other: Matrix2D, result: Matrix2D): Matrix2D {
            let l0 = this.m[0];     let l1 = this.m[1];
            let l2 = this.m[2];     let l3 = this.m[3];
            let l4 = this.m[4];     let l5 = this.m[5];

            let r0 = other.m[0];    let r1 = other.m[1];
            let r2 = other.m[2];    let r3 = other.m[3];
            let r4 = other.m[4];    let r5 = other.m[5];

            result.m[0] = l0 * r0 + l1 * r2;        result.m[1] = l0 * r1 + l1 * r3;
            result.m[2] = l2 * r0 + l3 * r2;        result.m[3] = l2 * r1 + l3 * r3;
            result.m[4] = l4 * r0 + l5 * r2 + r4;   result.m[5] = l4 * r1 + l5 * r3 + r5;

            return this;
        }

        public transformCoordinates(x: number, y: number, result: Vector2): Matrix2D {
            result.x = x * this.m[0] + y * this.m[2] + this.m[4];
            result.y = x * this.m[1] + y * this.m[3] + this.m[5];

            return this;
        }

        // Statics
        public static Identity(): Matrix2D {
            return new Matrix2D(1, 0, 0, 1, 0, 0);
        }

        public static TranslationToRef(x: number, y: number, result: Matrix2D): void {
            result.fromValues(1, 0, 0, 1, x, y);
        }

        public static ScalingToRef(x: number, y: number, result: Matrix2D): void {
            result.fromValues(x, 0, 0, y,  0, 0);
        }

        public static RotationToRef(angle: number, result: Matrix2D): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.fromValues(c, s, -s, c,  0, 0);
        }

        private static _TempPreTranslationMatrix = Matrix2D.Identity();
        private static _TempPostTranslationMatrix = Matrix2D.Identity();
        private static _TempRotationMatrix = Matrix2D.Identity();
        private static _TempScalingMatrix = Matrix2D.Identity();
        private static _TempCompose0 = Matrix2D.Identity();
        private static _TempCompose1 = Matrix2D.Identity();
        private static _TempCompose2 = Matrix2D.Identity();

        public static ComposeToRef(tx: number, ty: number, angle: number, scaleX: number, scaleY: number, parentMatrix: Nullable<Matrix2D>,  result: Matrix2D): void {
            Matrix2D.TranslationToRef(tx, ty, Matrix2D._TempPreTranslationMatrix);

            Matrix2D.ScalingToRef(scaleX, scaleY, Matrix2D._TempScalingMatrix);

            Matrix2D.RotationToRef(angle, Matrix2D._TempRotationMatrix);

            Matrix2D.TranslationToRef(-tx, -ty, Matrix2D._TempPostTranslationMatrix);

            Matrix2D._TempPreTranslationMatrix.multiplyToRef(Matrix2D._TempScalingMatrix, Matrix2D._TempCompose0);
            Matrix2D._TempCompose0.multiplyToRef(Matrix2D._TempRotationMatrix, Matrix2D._TempCompose1);
            if (parentMatrix) {
                Matrix2D._TempCompose1.multiplyToRef(Matrix2D._TempPostTranslationMatrix, Matrix2D._TempCompose2);
                Matrix2D._TempCompose2.multiplyToRef(parentMatrix, result);
            } else {
                Matrix2D._TempCompose1.multiplyToRef(Matrix2D._TempPostTranslationMatrix, result);
            }
        }
    }    
}