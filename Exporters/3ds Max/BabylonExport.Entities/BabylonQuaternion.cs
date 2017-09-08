using System;

namespace BabylonExport.Entities
{
    public class BabylonQuaternion
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
        public float W { get; set; }

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
    }
}
