using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEngine;

namespace Unity3D2Babylon
{
    public class SerializableColor
    {
        public float r { get; set; }
        public float g { get; set; }
        public float b { get; set; }
        public float a { get; set; }

        public static implicit operator Color(SerializableColor source)
        {
            return new Color(source.r, source.g, source.b, source.a);
        }

        public static implicit operator SerializableColor(Color source)
        {
            return new SerializableColor { r = source.r, g = source.g, b = source.b, a = source.a };
        }
    }
}
