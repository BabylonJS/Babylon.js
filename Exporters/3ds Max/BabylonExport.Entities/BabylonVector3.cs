using System;

namespace BabylonExport.Entities
{
    public class BabylonVector3
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }

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

        public BabylonQuaternion toQuaternionGltf()
        {
            BabylonQuaternion babylonQuaternion = RotationYawPitchRollToRefBabylon(X, -Y, -Z);
            // Doing following computation is ugly but works
            // The goal is to switch from left to right handed coordinate system
            // Swap X and Y
            var tmp = babylonQuaternion.X;
            babylonQuaternion.X = babylonQuaternion.Y;
            babylonQuaternion.Y = tmp;
            return babylonQuaternion;
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
    }
}
