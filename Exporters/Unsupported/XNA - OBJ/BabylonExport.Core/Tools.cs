using SharpDX;
using Vertice.Core;

namespace BabylonExport.Core
{
    public static class Tools
    {      
        public static Color3 ToColor3(this Microsoft.Xna.Framework.Vector3 value)
        {
            return new Color3(value.X, value.Y, value.Z);
        }

        public static float[] ToArray(this RGBAColor color)
        {
            return new []{color.Red, color.Green, color.Blue, color.Alpha};
        }

        public static float[] ToArray(this Vertice.Core.Vector3 vector3)
        {
            return new[] { vector3.X, vector3.Y, vector3.Z };
        }

        public static float[] ToArray(this Vertice.Core.Matrix matrix)
        {
            return new[]
            {
                matrix.M11, matrix.M12, matrix.M13, matrix.M14,
                matrix.M21, matrix.M22, matrix.M23, matrix.M24,
                matrix.M31, matrix.M32, matrix.M33, matrix.M34,
                matrix.M41, matrix.M42, matrix.M43, matrix.M44,
            };
        }

        public static float[] ToArray(this Vertice.Core.Vector4 vector4)
        {
            return new[] { vector4.X, vector4.Y, vector4.Z, vector4.W };
        }

        public static float[] ToArray(this Vertice.Core.Quaternion quaternion)
        {
            return new[] { quaternion.X, quaternion.Y, quaternion.Z, quaternion.W };
        }

        public static SharpDX.Matrix ToMatrix(this Microsoft.Xna.Framework.Matrix value)
        {
            return new SharpDX.Matrix(
                value.M11, value.M12, value.M13, value.M14,
                value.M21, value.M22, value.M23, value.M24,
                value.M31, value.M32, value.M33, value.M34,
                value.M41, value.M42, value.M43, value.M44
                );
        }
    }
}
