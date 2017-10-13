using System;

namespace BabylonExport.Entities
{
    public class BabylonVector3
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }

        public BabylonVector3() { }

        /**
         * Creates a new Vector3 object from the passed x, y, z (floats) coordinates.  
         * A Vector3 is the main object used in 3D geometry.  
         * It can represent etiher the coordinates of a point the space, either a direction.  
         */
        public BabylonVector3(float x, float y, float z)
        {
            this.X = x;
            this.Y = y;
            this.Z = z;
        }

        public float[] ToArray()
        {
            return new [] {X, Y, Z};
        }

        public float Length()
        {
            return (float)Math.Sqrt(X * X + Y * Y + Z * Z);
        }

        public static BabylonVector3 operator +(BabylonVector3 a, BabylonVector3 b)
        {
            return new BabylonVector3 {X = a.X + b.X, Y = a.Y + b.Y, Z = a.Z + b.Z};
        }

        public static BabylonVector3 operator -(BabylonVector3 a, BabylonVector3 b)
        {
            return new BabylonVector3 { X = a.X - b.X, Y = a.Y - b.Y, Z = a.Z - b.Z };
        }

        public static BabylonVector3 operator /(BabylonVector3 a, float b)
        {
            return new BabylonVector3 { X = a.X / b, Y = a.Y / b, Z = a.Z / b };
        }

        public static BabylonVector3 operator *(BabylonVector3 a, float b)
        {
            return new BabylonVector3 { X = a.X * b, Y = a.Y * b, Z = a.Z * b };
        }

        public BabylonQuaternion toQuaternion()
        {
            return RotationYawPitchRollToRefBabylon(Y, X, Z);
        }

        /**
         * (Copy pasted from babylon)
         * Sets the passed quaternion "result" from the passed float Euler angles (y, x, z).  
         */
        private BabylonQuaternion RotationYawPitchRollToRefBabylon(float yaw, float pitch, float roll)
        {
            // Produces a quaternion from Euler angles in the z-y-x orientation (Tait-Bryan angles)
            var halfRoll = roll * 0.5;
            var halfPitch = pitch * 0.5;
            var halfYaw = yaw * 0.5;

            var sinRoll = Math.Sin(halfRoll);
            var cosRoll = Math.Cos(halfRoll);
            var sinPitch = Math.Sin(halfPitch);
            var cosPitch = Math.Cos(halfPitch);
            var sinYaw = Math.Sin(halfYaw);
            var cosYaw = Math.Cos(halfYaw);

            var result = new BabylonQuaternion();
            result.X = (float)((cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll));
            result.Y = (float)((sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll));
            result.Z = (float)((cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll));
            result.W = (float)((cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll));
            return result;
        }

        /**
         * Returns a new Vector3 set from the index "offset" of the passed array.
         */
        public static BabylonVector3 FromArray(float[] array, int offset = 0)
        {
            return new BabylonVector3(array[offset], array[offset + 1], array[offset + 2]);
        }

        public override string ToString()
        {
            return "{ X=" + X + ", Y=" + Y + ", Z=" + Z + " }";
        }
    }
}
