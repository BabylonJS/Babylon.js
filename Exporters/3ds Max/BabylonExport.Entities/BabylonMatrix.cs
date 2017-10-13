using System;

namespace BabylonExport.Entities
{
    public class BabylonMatrix
    {
        public float[] m = new float[16];

        /**
         * Returns a new Matrix as the passed inverted one.  
         */
        public static BabylonMatrix Invert(BabylonMatrix source) {
            var result = new BabylonMatrix();
            source.invertToRef(result);
            return result;
        }

        /**
         * Inverts in place the Matrix.  
         * Returns the Matrix inverted.  
         */
        public BabylonMatrix invert() {
            this.invertToRef(this);
            return this;
        }

        /**
         * Sets the passed matrix with the current inverted Matrix.  
         * Returns the unmodified current Matrix.  
         */
        public BabylonMatrix invertToRef(BabylonMatrix other) {
            var l1 = this.m[0];
            var l2 = this.m[1];
            var l3 = this.m[2];
            var l4 = this.m[3];
            var l5 = this.m[4];
            var l6 = this.m[5];
            var l7 = this.m[6];
            var l8 = this.m[7];
            var l9 = this.m[8];
            var l10 = this.m[9];
            var l11 = this.m[10];
            var l12 = this.m[11];
            var l13 = this.m[12];
            var l14 = this.m[13];
            var l15 = this.m[14];
            var l16 = this.m[15];
            var l17 = (l11 * l16) - (l12 * l15);
            var l18 = (l10 * l16) - (l12 * l14);
            var l19 = (l10 * l15) - (l11 * l14);
            var l20 = (l9 * l16) - (l12 * l13);
            var l21 = (l9 * l15) - (l11 * l13);
            var l22 = (l9 * l14) - (l10 * l13);
            var l23 = ((l6 * l17) - (l7 * l18)) + (l8 * l19);
            var l24 = -(((l5 * l17) - (l7 * l20)) + (l8 * l21));
            var l25 = ((l5 * l18) - (l6 * l20)) + (l8 * l22);
            var l26 = -(((l5 * l19) - (l6 * l21)) + (l7 * l22));
            var l27 = 1.0f / ((((l1 * l23) + (l2 * l24)) + (l3 * l25)) + (l4 * l26));
            var l28 = (l7 * l16) - (l8 * l15);
            var l29 = (l6 * l16) - (l8 * l14);
            var l30 = (l6 * l15) - (l7 * l14);
            var l31 = (l5 * l16) - (l8 * l13);
            var l32 = (l5 * l15) - (l7 * l13);
            var l33 = (l5 * l14) - (l6 * l13);
            var l34 = (l7 * l12) - (l8 * l11);
            var l35 = (l6 * l12) - (l8 * l10);
            var l36 = (l6 * l11) - (l7 * l10);
            var l37 = (l5 * l12) - (l8 * l9);
            var l38 = (l5 * l11) - (l7 * l9);
            var l39 = (l5 * l10) - (l6 * l9);

            other.m[0] = l23* l27;
            other.m[4] = l24* l27;
            other.m[8] = l25* l27;
            other.m[12] = l26* l27;
            other.m[1] = -(((l2* l17) - (l3* l18)) + (l4* l19)) * l27;
            other.m[5] = (((l1* l17) - (l3* l20)) + (l4* l21)) * l27;
            other.m[9] = -(((l1* l18) - (l2* l20)) + (l4* l22)) * l27;
            other.m[13] = (((l1* l19) - (l2* l21)) + (l3* l22)) * l27;
            other.m[2] = (((l2* l28) - (l3* l29)) + (l4* l30)) * l27;
            other.m[6] = -(((l1* l28) - (l3* l31)) + (l4* l32)) * l27;
            other.m[10] = (((l1* l29) - (l2* l31)) + (l4* l33)) * l27;
            other.m[14] = -(((l1* l30) - (l2* l32)) + (l3* l33)) * l27;
            other.m[3] = -(((l2* l34) - (l3* l35)) + (l4* l36)) * l27;
            other.m[7] = (((l1* l34) - (l3* l37)) + (l4* l38)) * l27;
            other.m[11] = -(((l1* l35) - (l2* l37)) + (l4* l39)) * l27;
            other.m[15] = (((l1* l36) - (l2* l38)) + (l3* l39)) * l27;
            
            return this;
        }

        /**
         * Returns a new Matrix composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).  
         */
        public static BabylonMatrix Compose(BabylonVector3 scale, BabylonQuaternion rotation, BabylonVector3 translation)
        {
            var result = BabylonMatrix.Identity();
            BabylonMatrix.ComposeToRef(scale, rotation, translation, result);
            return result;
        }

        /**
         * Update a Matrix with values composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).  
         */
        public static void ComposeToRef(BabylonVector3 scale, BabylonQuaternion rotation, BabylonVector3 translation, BabylonMatrix result) {
            var matrix1 = new BabylonMatrix();
            BabylonMatrix.FromValuesToRef(scale.X, 0, 0, 0,
                0, scale.Y, 0, 0,
                0, 0, scale.Z, 0,
                0, 0, 0, 1, matrix1);

            var matrix0 = new BabylonMatrix();
            rotation.toRotationMatrix(matrix0);
            matrix1.multiplyToRef(matrix0, result);

            result.setTranslation(translation);
        }
        
        /**
         * Returns a new indentity Matrix.  
         */
        public static BabylonMatrix Identity()
        {
            var matrix = new BabylonMatrix();
             BabylonMatrix.FromValuesToRef(
                1.0f, 0.0f, 0.0f, 0.0f,
                0.0f, 1.0f, 0.0f, 0.0f,
                0.0f, 0.0f, 1.0f, 0.0f,
                0.0f, 0.0f, 0.0f, 1.0f, matrix);
            return matrix;
        }

        public static BabylonMatrix operator *(BabylonMatrix a, BabylonMatrix b)
        {
            return a.multiply(b);
        }

        /**
         * Returns a new Matrix set with the multiplication result of the current Matrix and the passed one.  
         */
        public BabylonMatrix multiply(BabylonMatrix other) {
            var result = new BabylonMatrix();
            this.multiplyToRef(other, result);
            return result;
        }

        /**
         * Sets the passed matrix "result" with the multiplication result of the current Matrix and the passed one.  
         */
        public BabylonMatrix multiplyToRef(BabylonMatrix other, BabylonMatrix result) {
            this.multiplyToArray(other, result.m, 0);
            return this;
        }

        /**
         * Sets the Float32Array "result" from the passed index "offset" with the multiplication result of the current Matrix and the passed one.  
         */
        public BabylonMatrix multiplyToArray(BabylonMatrix other, float[] result, int offset)
        {
            var tm0 = this.m[0];
            var tm1 = this.m[1];
            var tm2 = this.m[2];
            var tm3 = this.m[3];
            var tm4 = this.m[4];
            var tm5 = this.m[5];
            var tm6 = this.m[6];
            var tm7 = this.m[7];
            var tm8 = this.m[8];
            var tm9 = this.m[9];
            var tm10 = this.m[10];
            var tm11 = this.m[11];
            var tm12 = this.m[12];
            var tm13 = this.m[13];
            var tm14 = this.m[14];
            var tm15 = this.m[15];

            var om0 = other.m[0];
            var om1 = other.m[1];
            var om2 = other.m[2];
            var om3 = other.m[3];
            var om4 = other.m[4];
            var om5 = other.m[5];
            var om6 = other.m[6];
            var om7 = other.m[7];
            var om8 = other.m[8];
            var om9 = other.m[9];
            var om10 = other.m[10];
            var om11 = other.m[11];
            var om12 = other.m[12];
            var om13 = other.m[13];
            var om14 = other.m[14];
            var om15 = other.m[15];

            result[offset] = tm0* om0 + tm1* om4 + tm2* om8 + tm3* om12;
            result[offset + 1] = tm0* om1 + tm1* om5 + tm2* om9 + tm3* om13;
            result[offset + 2] = tm0* om2 + tm1* om6 + tm2* om10 + tm3* om14;
            result[offset + 3] = tm0* om3 + tm1* om7 + tm2* om11 + tm3* om15;

            result[offset + 4] = tm4* om0 + tm5* om4 + tm6* om8 + tm7* om12;
            result[offset + 5] = tm4* om1 + tm5* om5 + tm6* om9 + tm7* om13;
            result[offset + 6] = tm4* om2 + tm5* om6 + tm6* om10 + tm7* om14;
            result[offset + 7] = tm4* om3 + tm5* om7 + tm6* om11 + tm7* om15;

            result[offset + 8] = tm8* om0 + tm9* om4 + tm10* om8 + tm11* om12;
            result[offset + 9] = tm8* om1 + tm9* om5 + tm10* om9 + tm11* om13;
            result[offset + 10] = tm8* om2 + tm9* om6 + tm10* om10 + tm11* om14;
            result[offset + 11] = tm8* om3 + tm9* om7 + tm10* om11 + tm11* om15;

            result[offset + 12] = tm12* om0 + tm13* om4 + tm14* om8 + tm15* om12;
            result[offset + 13] = tm12* om1 + tm13* om5 + tm14* om9 + tm15* om13;
            result[offset + 14] = tm12* om2 + tm13* om6 + tm14* om10 + tm15* om14;
            result[offset + 15] = tm12* om3 + tm13* om7 + tm14* om11 + tm15* om15;
            return this;
        }

        /**
         * Inserts the translation vector in the current Matrix.  
         * Returns the updated Matrix.  
         */
        public BabylonMatrix setTranslation(BabylonVector3 vector3) {
            this.m[12] = vector3.X;
            this.m[13] = vector3.Y;
            this.m[14] = vector3.Z;
            
            return this;
        }

        /**
         * Decomposes the current Matrix into : 
         * - a scale vector3 passed as a reference to update, 
         * - a rotation quaternion passed as a reference to update,
         * - a translation vector3 passed as a reference to update.  
         * Returns the boolean `true`.  
         */
        public bool decompose(BabylonVector3 scale, BabylonQuaternion rotation, BabylonVector3 translation)
        {
            translation.X = this.m[12];
            translation.Y = this.m[13];
            translation.Z = this.m[14];

            scale.X = (float)Math.Sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1] + this.m[2] * this.m[2]);
            scale.Y = (float)Math.Sqrt(this.m[4] * this.m[4] + this.m[5] * this.m[5] + this.m[6] * this.m[6]);
            scale.Z = (float)Math.Sqrt(this.m[8] * this.m[8] + this.m[9] * this.m[9] + this.m[10] * this.m[10]);

            if (this.determinant() <= 0) {
                scale.Y *= -1;
            }

            if (scale.X == 0 || scale.Y == 0 || scale.Z == 0) {
                rotation.X = 0;
                rotation.Y = 0;
                rotation.Z = 0;
                rotation.W = 1;
                return false;
            }

            var matrix = new BabylonMatrix();

            BabylonMatrix.FromValuesToRef(
                this.m[0] / scale.X, this.m[1] / scale.X, this.m[2] / scale.X, 0,
                this.m[4] / scale.Y, this.m[5] / scale.Y, this.m[6] / scale.Y, 0,
                this.m[8] / scale.Z, this.m[9] / scale.Z, this.m[10] / scale.Z, 0,
                0, 0, 0, 1, matrix);

            BabylonQuaternion.FromRotationMatrixToRef(matrix, rotation);

            return true;
        }

        /**
         * Returns the matrix determinant (float).  
         */
        public float determinant()
        {
            var temp1 = (this.m[10] * this.m[15]) - (this.m[11] * this.m[14]);
            var temp2 = (this.m[9] * this.m[15]) - (this.m[11] * this.m[13]);
            var temp3 = (this.m[9] * this.m[14]) - (this.m[10] * this.m[13]);
            var temp4 = (this.m[8] * this.m[15]) - (this.m[11] * this.m[12]);
            var temp5 = (this.m[8] * this.m[14]) - (this.m[10] * this.m[12]);
            var temp6 = (this.m[8] * this.m[13]) - (this.m[9] * this.m[12]);

            return ((((this.m[0] * (((this.m[5] * temp1) - (this.m[6] * temp2)) + (this.m[7] * temp3))) - (this.m[1] * (((this.m[4] * temp1) -
                (this.m[6] * temp4)) + (this.m[7] * temp5)))) + (this.m[2] * (((this.m[4] * temp2) - (this.m[5] * temp4)) + (this.m[7] * temp6)))) -
                (this.m[3] * (((this.m[4] * temp3) - (this.m[5] * temp5)) + (this.m[6] * temp6))));
        }

        /**
            * Sets the passed matrix "result" with the 16 passed floats.  
            */
        public static void FromValuesToRef(float initialM11, float initialM12, float initialM13, float initialM14,
        float initialM21, float initialM22, float initialM23, float initialM24,
        float initialM31, float initialM32, float initialM33, float initialM34,
        float initialM41, float initialM42, float initialM43, float initialM44, BabylonMatrix result)
        {
            result.m[0] = initialM11;
            result.m[1] = initialM12;
            result.m[2] = initialM13;
            result.m[3] = initialM14;
            result.m[4] = initialM21;
            result.m[5] = initialM22;
            result.m[6] = initialM23;
            result.m[7] = initialM24;
            result.m[8] = initialM31;
            result.m[9] = initialM32;
            result.m[10] = initialM33;
            result.m[11] = initialM34;
            result.m[12] = initialM41;
            result.m[13] = initialM42;
            result.m[14] = initialM43;
            result.m[15] = initialM44;
        }
}
}
