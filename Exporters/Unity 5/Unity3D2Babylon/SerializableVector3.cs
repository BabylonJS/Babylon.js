using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEngine;

namespace Unity3D2Babylon
{
    public class SerializableVector3
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }

        public static implicit operator Vector3(SerializableVector3 source)
        {
            return new Vector3(source.X, source.Y, source.Z);
        }

        public static implicit operator SerializableVector3(Vector3 source)
        {
            return new SerializableVector3 { X = source.x, Y = source.y, Z = source.z };
        }
    }
}
