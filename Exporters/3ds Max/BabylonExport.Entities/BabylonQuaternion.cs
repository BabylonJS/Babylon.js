using System;

namespace BabylonExport.Entities
{
    public class BabylonQuaternion
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
        public float W { get; set; }


        public BabylonQuaternion() { }

        /**
         * Creates a new Quaternion from the passed floats.  
         */
        public BabylonQuaternion(float x, float y, float z, float w)
        {
            this.X = x;
            this.Y = y;
            this.Z = z;
            this.W = w;
        }

        public float[] ToArray()
        {
            return new [] {X, Y, Z, W};
        }

        /**
         * Copy / pasted from babylon 
         */
        public BabylonVector3 toEulerAngles()
        {
            var result = new BabylonVector3();

            var qz = this.Z;
            var qx = this.X;
            var qy = this.Y;
            var qw = this.W;

            var sqw = qw * qw;
            var sqz = qz * qz;
            var sqx = qx * qx;
            var sqy = qy * qy;

            var zAxisY = qy * qz - qx * qw;
            var limit = .4999999;

            if (zAxisY< -limit) {
                result.Y = (float) (2 * Math.Atan2(qy, qw));
                result.X = (float) Math.PI / 2;
                result.Z = 0;
            } else if (zAxisY > limit) {
                result.Y = (float) (2 * Math.Atan2(qy, qw));
                result.X = (float) -Math.PI / 2;
                result.Z = 0;
            } else {
                result.Z = (float)Math.Atan2(2.0 * (qx* qy + qz* qw), (-sqz - sqx + sqy + sqw));
                result.X = (float)Math.Asin(-2.0 * (qz* qy - qx* qw));
                result.Y = (float)Math.Atan2(2.0 * (qz* qx + qy* qw), (sqz - sqx - sqy + sqw));
            }

            return result;
        }

        public override string ToString()
        {
            return "{ X=" + X + ", Y=" + Y + ", Z=" + Z + ", W=" + W + " }";
        }

        /**
         * Updates the passed quaternion "result" with the passed rotation matrix values.  
         */
        public static void FromRotationMatrixToRef(BabylonMatrix matrix, BabylonQuaternion result) {
            var data = matrix.m;
            float m11 = data[0], m12 = data[4], m13 = data[8];
            float m21 = data[1], m22 = data[5], m23 = data[9];
            float m31 = data[2], m32 = data[6], m33 = data[10];
            var trace = m11 + m22 + m33;
            float s;

            if (trace > 0) {

                s = (float) (0.5 / Math.Sqrt(trace + 1.0));

                result.W = 0.25f / s;
                result.X = (m32 - m23) * s;
                result.Y = (m13 - m31) * s;
                result.Z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {

                s = (float)(2.0 * Math.Sqrt(1.0 + m11 - m22 - m33));

                result.W = (m32 - m23) / s;
                result.X = 0.25f * s;
                result.Y = (m12 + m21) / s;
                result.Z = (m13 + m31) / s;
            } else if (m22 > m33) {

                s = (float)(2.0 * Math.Sqrt(1.0 + m22 - m11 - m33));

                result.W = (m13 - m31) / s;
                result.X = (m12 + m21) / s;
                result.Y = 0.25f * s;
                result.Z = (m23 + m32) / s;
            } else {

                s = (float)(2.0 * Math.Sqrt(1.0 + m33 - m11 - m22));

                result.W = (m21 - m12) / s;
                result.X = (m13 + m31) / s;
                result.Y = (m23 + m32) / s;
                result.Z = 0.25f * s;
            }
        }

        /**
         * Updates the passed rotation matrix with the current Quaternion values.  
         * Returns the current Quaternion.  
         */
        public BabylonQuaternion toRotationMatrix(BabylonMatrix result) {
            var xx = this.X * this.X;
            var yy = this.Y * this.Y;
            var zz = this.Z * this.Z;
            var xy = this.X * this.Y;
            var zw = this.Z * this.W;
            var zx = this.Z * this.X;
            var yw = this.Y * this.W;
            var yz = this.Y * this.Z;
            var xw = this.X * this.W;

            result.m[0] = 1.0f - (2.0f * (yy + zz));
            result.m[1] = 2.0f * (xy + zw);
            result.m[2] = 2.0f * (zx - yw);
            result.m[3] = 0;
            result.m[4] = 2.0f * (xy - zw);
            result.m[5] = 1.0f - (2.0f * (zz + xx));
            result.m[6] = 2.0f * (yz + xw);
            result.m[7] = 0;
            result.m[8] = 2.0f * (zx + yw);
            result.m[9] = 2.0f * (yz - xw);
            result.m[10] = 1.0f - (2.0f * (yy + xx));
            result.m[11] = 0;
            result.m[12] = 0;
            result.m[13] = 0;
            result.m[14] = 0;
            result.m[15] = 1.0f;
            
            return this;
        }

        /**
         * Retuns a new Quaternion set from the starting index of the passed array.
         */
        public static BabylonQuaternion FromArray(float[] array, int offset = 0)
        {
            return new BabylonQuaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }
    }
}
