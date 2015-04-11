using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEngine;

namespace Unity3D2Babylon
{
    public static class Tools
    {
        public static float[] ToFloat(this Color color)
        {
            var result = new float[4];
            result[0] = color.r;
            result[1] = color.g;
            result[2] = color.b;
            result[3] = color.a;

            return result;
        }

        public static float[] ToFloat(this Vector3 vector3)
        {
            var result = new float[3];
            result[0] = vector3.x;
            result[1] = vector3.y;
            result[2] = vector3.z;

            return result;
        }

        public static float[] ToFloat(this SerializableVector3 vector3)
        {
            var result = new float[3];
            result[0] = vector3.X;
            result[1] = vector3.Y;
            result[2] = vector3.Z;

            return result;
        }

        public static float[] ToFloat(this Quaternion quaternion)
        {
            var result = new float[4];
            result[0] = quaternion.x;
            result[1] = quaternion.y;
            result[2] = quaternion.z;
            result[3] = quaternion.w;

            return result;
        }
    }
}
